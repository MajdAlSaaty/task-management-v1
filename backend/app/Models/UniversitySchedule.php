<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class UniversitySchedule extends Model
{
    protected $table = 'university_schedule';
    
    protected $fillable = [
        'user_id',
        'title',
        'day_of_week',
        'start_time',
        'end_time',
        'valid_from',
        'valid_until'
    ];

    protected $casts = [
        'valid_from' => 'date',
        'valid_until' => 'date'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Check if this schedule entry applies on a specific date.
    public function appliesOnDate(Carbon $date): bool
    {
        // Check if the day of week matches
        if ($date->format('l') !== $this->day_of_week) {
            return false;
        }
        
        // Check if date is after valid_from
        if ($date->lt($this->valid_from)) {
            return false;
        }
        
        // Check if date is before valid_until (if set)
        if ($this->valid_until && $date->gt($this->valid_until)) {
            return false;
        }
        
        return true;
    }

  
}