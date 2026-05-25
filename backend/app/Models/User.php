<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Models\Task;
use App\Models\ScheduledSlot;
use App\Models\UserDailyPreference;
use App\Models\UniversitySchedule;  // Make sure this import exists

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password'];
    protected $hidden = ['password', 'remember_token'];

    // JWT Methods
    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return []; }

    // Relationships
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function scheduledSlots()
    {
        return $this->hasMany(ScheduledSlot::class);
    }

    public function dailyPreferences()
    {
        return $this->hasMany(UserDailyPreference::class);
    }

    
    public function universitySchedule()
    {
        return $this->hasMany(UniversitySchedule::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function conflictLogs()
    {
        return $this->hasMany(ConflictLog::class);
    }
}