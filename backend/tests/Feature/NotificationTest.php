<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
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

    public function test_list_notifications(): void
    {
        Notification::create(['user_id' => $this->user->id, 'type' => 'reminder', 'message' => 'Test', 'scheduled_time' => Carbon::now(), 'is_read' => false]);
        Notification::create(['user_id' => $this->user->id, 'type' => 'reminder', 'message' => 'Test 2', 'scheduled_time' => Carbon::now(), 'is_read' => false]);
        Notification::create(['user_id' => $this->user->id, 'type' => 'system', 'message' => 'Test 3', 'scheduled_time' => Carbon::now(), 'is_read' => true]);

        $response = $this->withHeaders($this->headers())->getJson('/api/notifications');
        $response->assertStatus(200);
    }

    public function test_show_notification(): void
    {
        $notification = Notification::create([
            'user_id' => $this->user->id,
            'type' => 'reminder',
            'message' => 'Read this',
            'scheduled_time' => Carbon::now(),
            'is_read' => false,
        ]);

        $response = $this->withHeaders($this->headers())
            ->getJson("/api/notifications/{$notification->id}");

        $response->assertStatus(200)->assertJsonPath('id', $notification->id);
    }

    public function test_mark_as_read(): void
    {
        $notification = Notification::create([
            'user_id' => $this->user->id,
            'type' => 'reminder',
            'message' => 'Unread',
            'scheduled_time' => Carbon::now(),
            'is_read' => false,
        ]);

        $response = $this->withHeaders($this->headers())
            ->putJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200);
        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'is_read' => true,
        ]);
    }

    public function test_mark_all_as_read(): void
    {
        Notification::create(['user_id' => $this->user->id, 'type' => 'reminder', 'message' => 'A', 'scheduled_time' => Carbon::now(), 'is_read' => false]);
        Notification::create(['user_id' => $this->user->id, 'type' => 'reminder', 'message' => 'B', 'scheduled_time' => Carbon::now(), 'is_read' => false]);
        Notification::create(['user_id' => $this->user->id, 'type' => 'system', 'message' => 'C', 'scheduled_time' => Carbon::now(), 'is_read' => false]);

        $response = $this->withHeaders($this->headers())
            ->putJson('/api/notifications/read-all');

        $response->assertStatus(200);
        $this->assertDatabaseMissing('notifications', [
            'user_id' => $this->user->id,
            'is_read' => false,
        ]);
    }

    public function test_delete_notification(): void
    {
        $notification = Notification::create([
            'user_id' => $this->user->id,
            'type' => 'system',
            'message' => 'Delete me',
            'scheduled_time' => Carbon::now(),
            'is_read' => true,
        ]);

        $response = $this->withHeaders($this->headers())
            ->deleteJson("/api/notifications/{$notification->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('notifications', ['id' => $notification->id]);
    }
}
