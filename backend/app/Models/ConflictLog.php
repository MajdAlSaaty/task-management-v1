<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConflictLog extends Model
{
    protected $fillable = [
        'user_id',
        'task_id',
        'conflict_type',
        'suggested_fix',
    ];

    protected $table = 'conflicts_log';   // because your migration uses plural name

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function task1()
    {
        return $this->belongsTo(Task::class, 'task1_id');
    }

    public function task2()
    {
        return $this->belongsTo(Task::class, 'task2_id');
    }
}