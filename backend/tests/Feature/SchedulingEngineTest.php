<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\UniversitySchedule;
use App\Models\User;
use App\Models\UserDailyPreference;
use App\Services\SchedulingEngine;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchedulingEngineTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_university_schedule_blocks_class_time_in_auto_scheduling(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-13 08:00:00'));

        $user = User::factory()->create();

        $task = Task::create([
            'user_id' => $user->id,
            'title' => 'Prepare for exam',
            'priority' => 2,
            'status' => 'pending',
            'duration_minutes' => 120,
            'deadline' => '2026-04-13 23:59:59',
        ]);

        $preference = UserDailyPreference::create([
            'user_id' => $user->id,
            'day_of_week' => 'Monday',
            'preferred_start_time' => '09:00',
            'preferred_end_time' => '17:00',
            'daily_study_minutes_limit' => null,
            'break_start_time' => null,
            'break_end_time' => null,
        ]);

        UniversitySchedule::create([
            'user_id' => $user->id,
            'title' => 'Algorithms Lecture',
            'day_of_week' => 'Monday',
            'start_time' => '09:00',
            'end_time' => '11:00',
            'valid_from' => '2026-01-01',
            'valid_until' => null,
        ]);

        $result = app(SchedulingEngine::class)->scheduleTask($task, collect([$preference]));

        $this->assertTrue($result['success']);
        $this->assertDatabaseCount('scheduled_slots', 1);

        $slot = $task->fresh()->scheduledSlots()->firstOrFail();
        $this->assertSame('2026-04-13 11:00:00', $slot->start_time->format('Y-m-d H:i:s'));
        $this->assertSame('2026-04-13 13:00:00', $slot->end_time->format('Y-m-d H:i:s'));
    }

    public function test_daily_study_limit_splits_task_across_multiple_days(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-13 08:00:00'));

        $user = User::factory()->create();

        $task = Task::create([
            'user_id' => $user->id,
            'title' => 'Finish project report',
            'priority' => 3,
            'status' => 'pending',
            'duration_minutes' => 480,
            'deadline' => '2026-04-14 23:59:59',
        ]);

        $mondayPreference = UserDailyPreference::create([
            'user_id' => $user->id,
            'day_of_week' => 'Monday',
            'preferred_start_time' => '09:00',
            'preferred_end_time' => '17:00',
            'daily_study_minutes_limit' => 240,
            'break_start_time' => null,
            'break_end_time' => null,
        ]);

        $tuesdayPreference = UserDailyPreference::create([
            'user_id' => $user->id,
            'day_of_week' => 'Tuesday',
            'preferred_start_time' => '09:00',
            'preferred_end_time' => '17:00',
            'daily_study_minutes_limit' => 240,
            'break_start_time' => null,
            'break_end_time' => null,
        ]);

        $result = app(SchedulingEngine::class)
            ->scheduleTask($task, collect([$mondayPreference, $tuesdayPreference]));

        $this->assertTrue($result['success']);

        $slots = $task->fresh()->scheduledSlots()->orderBy('start_time')->get();
        $this->assertCount(2, $slots);

        $this->assertSame(240, (int) $slots[0]->start_time->diffInMinutes($slots[0]->end_time));
        $this->assertSame(240, (int) $slots[1]->start_time->diffInMinutes($slots[1]->end_time));
        $this->assertSame('2026-04-13', $slots[0]->start_time->toDateString());
        $this->assertSame('2026-04-14', $slots[1]->start_time->toDateString());
    }

    public function test_scheduler_uses_multiple_gaps_in_the_same_day(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-13 08:00:00'));

        $user = User::factory()->create();

        $task = Task::create([
            'user_id' => $user->id,
            'title' => 'Deep study session',
            'priority' => 1,
            'status' => 'pending',
            'duration_minutes' => 300,
            'deadline' => '2026-04-13 23:59:59',
        ]);

        $preference = UserDailyPreference::create([
            'user_id' => $user->id,
            'day_of_week' => 'Monday',
            'preferred_start_time' => '09:00',
            'preferred_end_time' => '17:00',
            'daily_study_minutes_limit' => null,
            'break_start_time' => null,
            'break_end_time' => null,
        ]);

        UniversitySchedule::create([
            'user_id' => $user->id,
            'title' => 'Class A',
            'day_of_week' => 'Monday',
            'start_time' => '11:00',
            'end_time' => '12:00',
            'valid_from' => '2026-01-01',
            'valid_until' => null,
        ]);

        UniversitySchedule::create([
            'user_id' => $user->id,
            'title' => 'Class B',
            'day_of_week' => 'Monday',
            'start_time' => '14:00',
            'end_time' => '15:00',
            'valid_from' => '2026-01-01',
            'valid_until' => null,
        ]);

        $result = app(SchedulingEngine::class)->scheduleTask($task, collect([$preference]));

        $this->assertTrue($result['success']);

        $slots = $task->fresh()->scheduledSlots()->orderBy('start_time')->get();
        $this->assertCount(3, $slots);

        $this->assertSame('09:00', $slots[0]->start_time->format('H:i'));
        $this->assertSame('11:00', $slots[0]->end_time->format('H:i'));

        $this->assertSame('12:00', $slots[1]->start_time->format('H:i'));
        $this->assertSame('14:00', $slots[1]->end_time->format('H:i'));

        $this->assertSame('15:00', $slots[2]->start_time->format('H:i'));
        $this->assertSame('16:00', $slots[2]->end_time->format('H:i'));
    }
}
