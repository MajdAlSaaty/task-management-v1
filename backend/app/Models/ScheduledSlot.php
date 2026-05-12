<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledSlot extends Model
{
    protected $fillable = [
        'user_id',
        'task_id',
        'start_time',
        'end_time',
        'status'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime'
    ];

    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    
    public function getDurationMinutesAttribute(): int
    {
        return $this->start_time->diffInMinutes($this->end_time);
    }

    /**
     * Scope to find overlapping slots for a user.
     * Used to prevent double-booking.
     */
    public function scopeOverlapping($query, $userId, $start, $end, $excludeId = null)
    {
        return $query->where('user_id', $userId)
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start)
            ->when($excludeId, function ($q) use ($excludeId) {
                $q->where('id', '!=', $excludeId);
            });
    }
}