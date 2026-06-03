<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use App\Models\UserDailyPreference;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    private string $token;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->token = auth('api')->login($this->user);
    }

    protected function headers(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_list_tasks_empty(): void
    {
        $response = $this->withHeaders($this->headers())->getJson('/api/tasks');
        $response->assertStatus(200)->assertJsonCount(0, 'data');
    }

    public function test_create_task(): void
    {
        $response = $this->withHeaders($this->headers())->postJson('/api/tasks', [
            'title' => 'Study Math',
            'description' => 'Chapter 5',
            'priority' => 2,
            'duration_minutes' => 60,
            'deadline' => Carbon::tomorrow()->addDay()->toDateTimeString(),
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('title', 'Study Math');
    }

    public function test_create_task_requires_deadline_after_now(): void
    {
        $response = $this->withHeaders($this->headers())->postJson('/api/tasks', [
            'title' => 'Past Task',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::yesterday()->toDateTimeString(),
        ]);

        $response->assertStatus(422);
    }

    public function test_show_task(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Test Task',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $response = $this->withHeaders($this->headers())
            ->getJson("/api/tasks/{$task->id}");

        $response->assertStatus(200)->assertJsonPath('id', $task->id);
    }

    public function test_update_task(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Old Title',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $response = $this->withHeaders($this->headers())
            ->putJson("/api/tasks/{$task->id}", ['title' => 'New Title']);

        $response->assertStatus(200)->assertJsonPath('title', 'New Title');
    }

    public function test_delete_task(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Delete Me',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $response = $this->withHeaders($this->headers())
            ->deleteJson("/api/tasks/{$task->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_unauthorized_user_cannot_access_other_task(): void
    {
        $otherUser = User::factory()->create();
        $task = Task::create([
            'user_id' => $otherUser->id,
            'title' => 'Other Task',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $response = $this->withHeaders($this->headers())
            ->getJson("/api/tasks/{$task->id}");

        $response->assertStatus(403);
    }

    public function test_auto_schedule_single_task_with_preferences(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-13 08:00:00'));

        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Read Chapter',
            'priority' => 1,
            'status' => 'pending',
            'duration_minutes' => 60,
            'deadline' => '2026-04-13 23:59:59',
        ]);

        UserDailyPreference::create([
            'user_id' => $this->user->id,
            'day_of_week' => 'Monday',
            'preferred_start_time' => '09:00',
            'preferred_end_time' => '17:00',
            'break_start_time' => null,
            'break_end_time' => null,
        ]);

        $response = $this->withHeaders($this->headers())
            ->postJson("/api/tasks/{$task->id}/auto-schedule");

        $response->assertStatus(200)
            ->assertJsonStructure(['task', 'slots', 'weight', 'urgency']);
    }

    public function test_auto_schedule_without_preferences_returns_422(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'No Pref Task',
            'priority' => 3,
            'status' => 'pending',
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDay()->toDateTimeString(),
        ]);

        $response = $this->withHeaders($this->headers())
            ->postJson("/api/tasks/{$task->id}/auto-schedule");

        $response->assertStatus(422)
            ->assertJsonPath('error', 'No daily preferences found. Please set your study preferences first.');
    }

    public function test_auto_schedule_all(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-13 08:00:00'));

        Task::create([
            'user_id' => $this->user->id,
            'title' => 'Task A',
            'priority' => 1,
            'status' => 'pending',
            'duration_minutes' => 60,
            'deadline' => '2026-04-13 23:59:59',
        ]);

        UserDailyPreference::create([
            'user_id' => $this->user->id,
            'day_of_week' => 'Monday',
            'preferred_start_time' => '09:00',
            'preferred_end_time' => '17:00',
            'break_start_time' => null,
            'break_end_time' => null,
        ]);

        $response = $this->withHeaders($this->headers())
            ->postJson('/api/tasks/auto-schedule-all');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_get_task_weight(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Weight test',
            'priority' => 1,
            'duration_minutes' => 120,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $response = $this->withHeaders($this->headers())
            ->getJson("/api/tasks/{$task->id}/weight");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'task_id', 'title', 'priority', 'priority_inverted',
                'urgency', 'duration_minutes', 'duration_hours',
                'deadline', 'days_remaining', 'weight',
                'alpha_component', 'beta_component', 'gamma_component',
            ]);
    }
}
