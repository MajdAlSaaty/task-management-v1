<?php

namespace Tests\Feature;

use App\Models\ScheduledSlot;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SlotTest extends TestCase
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

    public function test_list_slots_empty(): void
    {
        $response = $this->withHeaders($this->headers())->getJson('/api/slots');
        $response->assertStatus(200)->assertJsonCount(0, 'data');
    }

    public function test_create_slot(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Slot task',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $response = $this->withHeaders($this->headers())->postJson('/api/slots', [
            'task_id' => $task->id,
            'start_time' => Carbon::tomorrow()->setHour(10)->toDateTimeString(),
            'end_time' => Carbon::tomorrow()->setHour(11)->toDateTimeString(),
        ]);

        $response->assertStatus(201)->assertJsonPath('task_id', $task->id);
    }

    public function test_slot_overlap_is_rejected(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'First task',
            'priority' => 3,
            'duration_minutes' => 60,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $start = Carbon::tomorrow()->setHour(10);
        $end = Carbon::tomorrow()->setHour(12);

        ScheduledSlot::create([
            'user_id' => $this->user->id,
            'task_id' => $task->id,
            'start_time' => $start,
            'end_time' => $end,
            'status' => 'scheduled',
        ]);

        $task2 = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Second task',
            'priority' => 2,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $response = $this->withHeaders($this->headers())->postJson('/api/slots', [
            'task_id' => $task2->id,
            'start_time' => Carbon::tomorrow()->setHour(11)->toDateTimeString(),
            'end_time' => Carbon::tomorrow()->setHour(13)->toDateTimeString(),
        ]);

        $response->assertStatus(422)->assertJsonPath('error', 'This time slot overlaps with an existing scheduled task.');
    }

    public function test_show_slot(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Show slot task',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $slot = ScheduledSlot::create([
            'user_id' => $this->user->id,
            'task_id' => $task->id,
            'start_time' => Carbon::tomorrow()->setHour(9),
            'end_time' => Carbon::tomorrow()->setHour(10),
            'status' => 'scheduled',
        ]);

        $response = $this->withHeaders($this->headers())
            ->getJson("/api/slots/{$slot->id}");

        $response->assertStatus(200)->assertJsonPath('id', $slot->id);
    }

    public function test_update_slot(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Update slot task',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $slot = ScheduledSlot::create([
            'user_id' => $this->user->id,
            'task_id' => $task->id,
            'start_time' => Carbon::tomorrow()->setHour(9),
            'end_time' => Carbon::tomorrow()->setHour(10),
            'status' => 'scheduled',
        ]);

        $response = $this->withHeaders($this->headers())
            ->putJson("/api/slots/{$slot->id}", ['status' => 'completed']);

        $response->assertStatus(200)->assertJsonPath('status', 'completed');
    }

    public function test_delete_slot(): void
    {
        $task = Task::create([
            'user_id' => $this->user->id,
            'title' => 'Delete slot task',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $slot = ScheduledSlot::create([
            'user_id' => $this->user->id,
            'task_id' => $task->id,
            'start_time' => Carbon::tomorrow()->setHour(9),
            'end_time' => Carbon::tomorrow()->setHour(10),
            'status' => 'scheduled',
        ]);

        $response = $this->withHeaders($this->headers())
            ->deleteJson("/api/slots/{$slot->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('scheduled_slots', ['id' => $slot->id]);
    }

    public function test_cannot_access_other_user_slot(): void
    {
        $otherUser = User::factory()->create();
        $task = Task::create([
            'user_id' => $otherUser->id,
            'title' => 'Other user task',
            'priority' => 3,
            'duration_minutes' => 30,
            'deadline' => Carbon::tomorrow()->addDays(3)->toDateTimeString(),
        ]);

        $slot = ScheduledSlot::create([
            'user_id' => $otherUser->id,
            'task_id' => $task->id,
            'start_time' => Carbon::tomorrow()->setHour(9),
            'end_time' => Carbon::tomorrow()->setHour(10),
            'status' => 'scheduled',
        ]);

        $response = $this->withHeaders($this->headers())
            ->getJson("/api/slots/{$slot->id}");

        $response->assertStatus(403);
    }
}
