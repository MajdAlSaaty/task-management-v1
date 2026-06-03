<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDailyPreference extends Model
{
    protected $table = 'user_daily_preferences';
    
    protected $fillable = [
        'user_id',
        'day_of_week',
        'preferred_start_time',
        'preferred_end_time',
        'break_start_time',
        'break_end_time'
    ];

    protected $casts = [];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
