<?php

namespace Tests\Feature;

use App\Models\ConflictLog;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConflictTest extends TestCase
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

    public function test_list_conflicts_empty(): void
    {
        $response = $this->withHeaders($this->headers())->getJson('/api/conflicts');
        $response->assertStatus(200)->assertJsonCount(0, 'data');
    }

    public function test_list_conflicts(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Conflicting task',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        ConflictLog::create([
            'user_id' => $this->user->id,
            'task1_id' => $task->id,
            'conflict_type' => 'insufficient_time',
        ]);

        $response = $this->withHeaders($this->headers())->getJson('/api/conflicts');
        $response->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_show_conflict(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Task for conflict',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $conflict = ConflictLog::create([
            'user_id' => $this->user->id,
            'task1_id' => $task->id,
            'conflict_type' => 'overlap',
        ]);

        $response = $this->withHeaders($this->headers())
            ->getJson("/api/conflicts/{$conflict->id}");

        $response->assertStatus(200)->assertJsonPath('id', $conflict->id);
    }

    public function test_cannot_view_other_user_conflict(): void
    {
        $otherUser = User::factory()->create();
        $task = Task::create([
            'user_id' => $otherUser->id,
            'title' => 'Other user task',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $conflict = ConflictLog::create([
            'user_id' => $otherUser->id,
            'task1_id' => $task->id,
            'conflict_type' => 'insufficient_time',
        ]);

        $response = $this->withHeaders($this->headers())
            ->getJson("/api/conflicts/{$conflict->id}");

        $response->assertStatus(403);
    }

    public function test_delete_conflict(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Delete conflict',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $conflict = ConflictLog::create([
            'user_id' => $this->user->id,
            'task1_id' => $task->id,
            'conflict_type' => 'overlap',
        ]);

        $response = $this->withHeaders($this->headers())
            ->deleteJson("/api/conflicts/{$conflict->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('conflicts_log', ['id' => $conflict->id]);
    }

    public function test_cannot_delete_other_user_conflict(): void
    {
        $otherUser = User::factory()->create();
        $task = Task::create([
            'user_id' => $otherUser->id,
            'title' => 'Other user task',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $conflict = ConflictLog::create([
            'user_id' => $otherUser->id,
            'task1_id' => $task->id,
            'conflict_type' => 'insufficient_time',
        ]);

        $response = $this->withHeaders($this->headers())
            ->deleteJson("/api/conflicts/{$conflict->id}");

        $response->assertStatus(403);
    }
}
