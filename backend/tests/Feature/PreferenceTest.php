<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserDailyPreference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PreferenceTest extends TestCase
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

    public function test_list_preferences_empty(): void
    {
        $response = $this->withHeaders($this->headers())->getJson('/api/preferences');
        $response->assertStatus(200)->assertJson([]);
    }

    public function test_list_preferences(): void
    {
        UserDailyPreference::create([
            'user_id' => $this->user->id,
            'day_of_week' => 'Monday',
            'preferred_start_time' => '09:00',
            'preferred_end_time' => '17:00',
        ]);

        $response = $this->withHeaders($this->headers())->getJson('/api/preferences');
        $response->assertStatus(200)->assertJsonCount(1);
    }

    public function test_create_preference(): void
    {
        $response = $this->withHeaders($this->headers())->putJson('/api/preferences', [
            'day_of_week' => 'Monday',
            'preferred_start_time' => '09:00',
            'preferred_end_time' => '17:00',
        ]);

        $response->assertStatus(200)->assertJsonPath('day_of_week', 'Monday');
    }

    public function test_create_preference_invalid_day(): void
    {
        $response = $this->withHeaders($this->headers())->putJson('/api/preferences', [
            'day_of_week' => 'Funday',
            'preferred_start_time' => '09:00',
            'preferred_end_time' => '17:00',
        ]);

        $response->assertStatus(422);
    }

    public function test_create_preference_end_before_start(): void
    {
        $response = $this->withHeaders($this->headers())->putJson('/api/preferences', [
            'day_of_week' => 'Monday',
            'preferred_start_time' => '17:00',
            'preferred_end_time' => '09:00',
        ]);

        $response->assertStatus(422);
    }

    public function test_show_preference(): void
    {
        UserDailyPreference::create([
            'user_id' => $this->user->id,
            'day_of_week' => 'Tuesday',
            'preferred_start_time' => '10:00',
            'preferred_end_time' => '18:00',
        ]);

        $response = $this->withHeaders($this->headers())
            ->getJson('/api/preferences/Tuesday');

        $response->assertStatus(200)->assertJsonPath('day_of_week', 'Tuesday');
    }

    public function test_show_preference_not_found(): void
    {
        $response = $this->withHeaders($this->headers())
            ->getJson('/api/preferences/Saturday');

        $response->assertStatus(404);
    }

    public function test_delete_preference(): void
    {
        UserDailyPreference::create([
            'user_id' => $this->user->id,
            'day_of_week' => 'Wednesday',
            'preferred_start_time' => '09:00',
            'preferred_end_time' => '17:00',
        ]);

        $response = $this->withHeaders($this->headers())
            ->deleteJson('/api/preferences/Wednesday');

        $response->assertStatus(200);
        $this->assertDatabaseMissing('user_daily_preferences', [
            'user_id' => $this->user->id,
            'day_of_week' => 'Wednesday',
        ]);
    }
}
