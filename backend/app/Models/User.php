<?php

namespace App\Models;

use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Models\Task;
use App\Models\ScheduledSlot;
use App\Models\UserDailyPreference;
use App\Models\UniversitySchedule;
use App\Notifications\VerifyEmailNotification;
use App\Notifications\PasswordResetNotification;

class User extends Authenticatable implements JWTSubject, MustVerifyEmailContract
{
    use HasFactory, Notifiable, MustVerifyEmail;

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

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new PasswordResetNotification($token));
    }
}