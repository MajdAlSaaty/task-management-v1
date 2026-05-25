<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'priority',
        'reminder_minutes',
        'status',
        'duration_minutes',
        'deadline'
    ];

    
    protected $casts = [
        'deadline' => 'datetime', 
        'priority' => 'integer'
    ];

    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    
    public function scheduledSlots(): HasMany
    {
        return $this->hasMany(ScheduledSlot::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function conflictLogs(): HasMany
    {
        return $this->hasMany(ConflictLog::class, 'task1_id');
    }

    // Calculate how many minutes are still unscheduled for this task.
    public function getRemainingMinutesAttribute(): int
    {
        $scheduledMinutes = $this->scheduledSlots()
            ->whereIn('status', ['scheduled', 'completed'])
            ->get()
            ->sum(function ($slot) {
                return $slot->start_time->diffInMinutes($slot->end_time);
            });
        
        return max(0, $this->duration_minutes - $scheduledMinutes);
    }

    //Check if the task has been fully scheduled.
    public function getIsFullyScheduledAttribute(): bool
    {
        return $this->remaining_minutes === 0;
    }

    //Scope a query to only include unscheduled tasks.
    public function scopeUnscheduled($query)
    {
        return $query->where('status', 'pending')
            ->whereDoesntHave('scheduledSlots', function ($q) {
                $q->whereIn('status', ['scheduled', 'completed']);
            });
    }
}
