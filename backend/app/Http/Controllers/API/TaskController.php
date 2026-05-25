<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\UserDailyPreference;
use App\Models\Notification;
use App\Services\SchedulingEngine;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Log;

class TaskController extends Controller
{
    use AuthorizesRequests;

    protected $schedulingEngine;

    public function __construct(SchedulingEngine $schedulingEngine)
    {
        $this->schedulingEngine = $schedulingEngine;
    }

    /**
     * Display a listing of the user's tasks.
     */
    public function index(Request $request)
    {
        $query = $request->user()->tasks()->with('scheduledSlots');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Store a newly created task.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|integer|between:1,5',
            'reminder_minutes' => 'nullable|integer|min:0',
            'duration_minutes' => 'required|integer|min:1',
            'deadline' => 'required|date|after:now',
            'status' => 'sometimes|in:pending,in_progress,completed,cancelled',
        ]);

        $task = $request->user()->tasks()->create($validated);

        return response()->json($task, 201);
    }

    /**
     * Display the specified task.
     */
    public function show(Task $task)
    {
        $this->authorize('view', $task);
        return response()->json($task->load('scheduledSlots'));
    }

    /**
     * Update the specified task.
     */
    public function update(Request $request, Task $task)
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'sometimes|integer|between:1,5',
            'reminder_minutes' => 'sometimes|integer|min:0',
            'duration_minutes' => 'sometimes|integer|min:1',
            'deadline' => 'sometimes|date|after:now',
            'status' => 'sometimes|in:pending,in_progress,completed,cancelled',
        ]);

        $task->update($validated);
        // Notify user of task status change when task is completed
        if (isset($validated["status"]) && $validated["status"] == "completed") {
            $this->notifyTaskStatusChange(
                $task,
                "system",
                "أحسنت! أكملت مهمة: {$task->title}"
            );
        }
        return response()->json($task);
    }

    /**
     * Remove the specified task.
     */
    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);
        $task->delete();
        return response()->json(null, 204);
    }

    /**
     * Automatically schedule a single task based on user preferences.
     */
    public function autoSchedule(Request $request, Task $task)
    {
        $this->authorize('update', $task);

        $preferences = UserDailyPreference::where('user_id', $request->user()->id)->get();

        if ($preferences->isEmpty()) {
            return response()->json([
                'error' => 'No daily preferences found. Please set your study preferences first.',
            ], 422);
        }

        // Calculate and log task weight for debugging
        $weight = $this->schedulingEngine->calculateTaskWeight($task);
        $urgency = $this->schedulingEngine->calculateUrgency($task);

        $result = $this->schedulingEngine->scheduleTask($task, $preferences);

        if (! $result['success']) {
            return response()->json([
                'error' => $result['reason'],
                'weight' => round($weight, 2),
                'urgency' => round($urgency, 4),
            ], 422);
        }

        // Notify user of task status change for auto-scheduled task
        if ($result['success'] && $task->status == 'in_progress') {
            $this->notifyTaskStatusChange(
                $task->fresh(),
                'system',
                "تم بدء جدولة مهمة: {$task->title}"
            );
        }

        return response()->json([
            'task' => $task->fresh()->load('scheduledSlots'),
            'slots' => $result['slots'],
            'weight' => round($weight, 2),
            'urgency' => round($urgency, 4),
        ]);
    }

    /**
     * Auto-schedule ALL pending tasks using the weighted algorithm.
     * Tasks are ordered by calculated weight (highest first).
     */
    public function autoScheduleAll(Request $request)
    {
        $preferences = UserDailyPreference::where('user_id', $request->user()->id)->get();

        if ($preferences->isEmpty()) {
            return response()->json([
                'success' => false,
                'results' => [],
                'error' => 'No daily preferences found. Please set your study preferences first.',
            ], 422);
        }

        // Get all pending, unscheduled tasks
        $tasks = $request->user()->tasks()
            ->unscheduled()
            ->get();

        if ($tasks->isEmpty()) {
            return response()->json([
                'success' => true,
                'results' => [],
                'message' => 'No pending tasks to schedule.',
            ]);
        }

        try {
            $result = $this->schedulingEngine->scheduleAllTasks($tasks, $preferences);
            return response()->json($result);
        } catch (\Throwable $e) {
            Log::error("Auto-schedule all error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'results' => [],
                'error' => 'Internal error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get task weight information without scheduling.
     * Useful for debugging and visualization.
     */
    public function getTaskWeight(Task $task)
    {
        $this->authorize('view', $task);

        $weight = $this->schedulingEngine->calculateTaskWeight($task);
        $urgency = $this->schedulingEngine->calculateUrgency($task);

        // Invert priority for display (1=highest → 5, 5=lowest → 1)
        $priorityInverted = 6 - $task->priority;

        return response()->json([
            'task_id' => $task->id,
            'title' => $task->title,
            'priority' => $task->priority,
            'priority_inverted' => $priorityInverted,
            'urgency' => round($urgency, 4),
            'duration_minutes' => $task->duration_minutes,
            'duration_hours' => round($task->duration_minutes / 60.0, 2),
            'deadline' => $task->deadline,
            'days_remaining' => $task->deadline
                ? max(0, now()->diffInDays(Carbon::parse($task->deadline), false))
                : null,
            'weight' => round($weight, 2),
            'alpha_component' => round(10.0 * $priorityInverted, 2),
            'beta_component' => round(50.0 * $urgency, 2),
            'gamma_component' => round(0.5 * ($task->duration_minutes / 60.0), 2),
        ]);
    }

    /**
     * Notify user of task status changes.
     */
    private function notifyTaskStatusChange(Task $task, string $type, string $message): void
    {
        Notification::create([
            'user_id' => $task->user_id,
            'task_id' => $task->id,
            'type' => $type,
            'message' => $message,
            'scheduled_time' => now(),
            'is_read' => false,
        ]);
    }
}