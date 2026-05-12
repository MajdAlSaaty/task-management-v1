<?php

namespace App\Services;

use App\Models\Task;
use App\Models\ScheduledSlot;
use App\Models\UserDailyPreference;
use App\Models\UniversitySchedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SchedulingEngine
{
    // Tuning parameters – tweak these to adjust the weighting
    private float $alpha = 10.0;   // weight of inverted priority
    private float $beta  = 50.0;   // weight of urgency
    private float $gamma = 0.5;    // weight of duration (hours)

    /**
     * Schedule ALL pending tasks in one go, ordered by descending weight.
     */
    public function scheduleAllTasks($tasks, $preferences): array
    {
        if ($tasks->isEmpty()) {
            return ['success' => true, 'results' => []];
        }

        // Load scheduledSlots relation for each task to calculate remaining_minutes
        foreach ($tasks as $task) {
            $task->load('scheduledSlots');
        }

        // Calculate weight for every task and store in separate array (not on model)
        $taskWeights = [];
        foreach ($tasks as $task) {
            $taskWeights[$task->id] = $this->calculateTaskWeight($task);
        }

        // Sort tasks by weight (highest first)
        $sortedTasks = $tasks->sortByDesc(function ($task) use ($taskWeights) {
            return $taskWeights[$task->id];
        });

        $results = [];
        $allSuccess = true;

        DB::beginTransaction();
        try {
            foreach ($sortedTasks as $task) {
                $weight = $taskWeights[$task->id];
                $res = $this->scheduleSingleTask($task, $preferences);
                $results[] = [
                    'task_id'   => $task->id,
                    'title'     => $task->title,
                    'weight'    => round($weight, 2),
                    'success'   => $res['success'],
                    'slots'     => $res['slots'] ?? [],
                    'reason'    => $res['reason'] ?? null,
                ];
                if (!$res['success']) {
                    $allSuccess = false;
                }
            }
            DB::commit();
            return ['success' => $allSuccess, 'results' => $results];
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Schedule a single task (backward compatible with existing auto‑schedule endpoint).
     */
    public function scheduleTask(Task $task, $preferences): array
    {
        // Ensure scheduledSlots relation is loaded for remaining_minutes calculation
        if (!$task->relationLoaded('scheduledSlots')) {
            $task->load('scheduledSlots');
        }
        return $this->scheduleSingleTask($task, $preferences);
    }

    /**
     * Linear weighted sum: W = α * P_inv + β * U + γ * D
     *
     * P_inv = 6 - priority   (invert so higher number = more important)
     * U = urgency
     * D = duration in hours
     */
    public function calculateTaskWeight(Task $task): float
    {
        $priorityInv = 6 - $task->priority;           // 1→5, 5→1
        $urgency     = $this->calculateUrgency($task);
        $durationHrs = $task->duration_minutes / 60.0;

        return $this->alpha * $priorityInv
             + $this->beta  * $urgency
             + $this->gamma * $durationHrs;
    }

    /**
     * Urgency function: U = 1 / ( days_remaining + 1 )
     */
    public function calculateUrgency(Task $task): float
    {
        $now = now();
        $deadline = Carbon::parse($task->deadline);

        if ($deadline->isPast()) {
            return 1.0;
        }

        // Total remaining time in days (including fractional part)
        $totalDays = max(0, $now->diffInDays($deadline, false))
                     + ($now->diffInHours($deadline, false) % 24) / 24.0;

        return 1.0 / ($totalDays + 1.0);
    }

    /**
     * Core logic: schedules a single task across available days.
     */
    private function scheduleSingleTask(Task $task, $preferences): array
    {
        $remaining = $task->remaining_minutes;
        if ($remaining <= 0) {
            return ['success' => true, 'task' => $task, 'slots' => []];
        }

        $now = now();
        $currentDate = $now->copy()->startOfDay();
        $deadline = Carbon::parse($task->deadline);

        // Treat date‑only deadlines as end of that day
        if ($deadline->hour == 0 && $deadline->minute == 0 && $deadline->second == 0) {
            $deadline->endOfDay();
        }
        if ($deadline->lt($now)) {
            return ['success' => false, 'task' => $task, 'reason' => 'Deadline passed'];
        }

        $deadlineDate = $deadline->copy()->startOfDay();
        $slots = [];

         try {
             while ($remaining > 0 && $currentDate->lte($deadlineDate)) {
                 $dayName = $currentDate->format('l');
                 $pref = $preferences->firstWhere('day_of_week', $dayName);

                 // Skip days without preferences
                 if (!$pref) {
                     $currentDate->addDay();
                     continue;
                 }

                 $scheduledToday = 0;
                 $dailyLimit = $pref->daily_study_minutes_limit;

                 while ($remaining > 0) {
                     $previousRemaining = $remaining;
                     if ($dailyLimit && $scheduledToday >= $dailyLimit) break;

                     $gap = $this->findAvailableSlot($task->user_id, $currentDate, $pref);
                     if (!$gap) break;

                     $slotStart = $gap['start']->copy();
                     $slotEnd = $slotStart->copy()->addMinutes($gap['available_minutes']);

                     if ($slotStart->gte($deadline)) break;
                     if ($slotEnd->gt($deadline)) $slotEnd = $deadline->copy();

                     $minutes = $slotStart->diffInMinutes($slotEnd);
                     if ($dailyLimit) {
                         $remainingDaily = $dailyLimit - $scheduledToday;
                         $minutes = min($minutes, $remainingDaily);
                     }
                     $minutes = min($minutes, $remaining);
                     if ($minutes <= 0) break;

                     $slotEndTime = $slotStart->copy()->addMinutes($minutes);
                     $conflicts = ScheduledSlot::overlapping(
                         $task->user_id,
                         $slotStart,
                         $slotEndTime
                     )->exists();

                     if ($conflicts) {
                         break;
                     }

                     $slot = ScheduledSlot::create([
                         'user_id'    => $task->user_id,
                         'task_id'    => $task->id,
                         'start_time' => $slotStart,
                         'end_time'   => $slotEndTime,
                         'status'     => 'scheduled',
                     ]);
                     $slots[] = $slot;
                     $remaining -= $minutes;
                     $scheduledToday += $minutes;

                     if ($remaining >= $previousRemaining) break;
                 }
                 $currentDate->addDay();
             }
         } catch (\Throwable $e) {
             Log::error("Scheduling error for task {$task->id}: " . $e->getMessage() . "\n" . $e->getTraceAsString());
             return ['success' => false, 'task' => $task, 'reason' => 'Internal error: ' . $e->getMessage()];
         }

         if ($remaining > 0) {
             return ['success' => false, 'task' => $task, 'reason' => 'Insufficient available time'];
         }

         $task->update(['status' => 'in_progress']);
         return ['success' => true, 'task' => $task, 'slots' => $slots];
     }

    /**
     * Greedy allocation: finds the earliest free gap on a specific day.
     */
    private function findAvailableSlot(int $userId, Carbon $date, UserDailyPreference $pref): ?array
    {
        $workStart = Carbon::parse($date->toDateString() . ' ' . $pref->preferred_start_time);
        $workEnd   = Carbon::parse($date->toDateString() . ' ' . $pref->preferred_end_time);
        if ($workEnd->lte($workStart)) return null;

        $blocked = [];

        // 1. Existing scheduled slots
        $existing = ScheduledSlot::where('user_id', $userId)
            ->whereDate('start_time', $date->toDateString())
            ->orderBy('start_time')
            ->get();
        foreach ($existing as $s) {
            $blocked[] = ['start' => Carbon::parse($s->start_time), 'end' => Carbon::parse($s->end_time)];
        }

        // 2. Break time
        if ($pref->break_start_time && $pref->break_end_time) {
            $blocked[] = [
                'start' => Carbon::parse($date->toDateString() . ' ' . $pref->break_start_time),
                'end'   => Carbon::parse($date->toDateString() . ' ' . $pref->break_end_time),
            ];
        }

        // 3. University schedule
        $uni = UniversitySchedule::where('user_id', $userId)
            ->where('day_of_week', $date->format('l'))
            ->where('valid_from', '<=', $date->toDateString())
            ->where(fn($q) => $q->whereNull('valid_until')->orWhere('valid_until', '>=', $date->toDateString()))
            ->get();
        foreach ($uni as $u) {
            $blocked[] = [
                'start' => Carbon::parse($date->toDateString() . ' ' . $u->start_time),
                'end'   => Carbon::parse($date->toDateString() . ' ' . $u->end_time),
            ];
        }

        // Sort blocked periods by start time
        usort($blocked, fn($a, $b) => $a['start']->timestamp - $b['start']->timestamp);

        $cur = $workStart->copy();
        $now = now();
        if ($date->isSameDay($now) && $now->gt($cur)) {
            $cur = $now->copy();
        }
        if ($cur->gte($workEnd)) return null;

        foreach ($blocked as $b) {
            $bs = $b['start'];
            $be = $b['end'];
            if ($be->lte($workStart) || $bs->gte($workEnd)) continue;
            if ($bs->lt($workStart)) $bs = $workStart->copy();
            if ($be->gt($workEnd)) $be = $workEnd->copy();

            if ($cur < $bs) {
                $mins = $cur->diffInMinutes($bs);
                if ($mins > 0) return ['start' => $cur, 'available_minutes' => $mins];
            }
            if ($be > $cur) $cur = $be->copy();
            if ($cur->gte($workEnd)) return null;
        }

        if ($cur < $workEnd) {
            $mins = $cur->diffInMinutes($workEnd);
            if ($mins > 0) return ['start' => $cur, 'available_minutes' => $mins];
        }

        return null;
    }
}