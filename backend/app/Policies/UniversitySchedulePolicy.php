<?php

namespace App\Policies;

use App\Models\UniversitySchedule;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UniversitySchedulePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any schedules.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the schedule.
     */
    public function view(User $user, UniversitySchedule $schedule): bool
    {
        return $user->id === $schedule->user_id;
    }

    /**
     * Determine whether the user can create schedules.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the schedule.
     */
    public function update(User $user, UniversitySchedule $schedule): bool
    {
        return $user->id === $schedule->user_id;
    }

    /**
     * Determine whether the user can delete the schedule.
     */
    public function delete(User $user, UniversitySchedule $schedule): bool
    {
        return $user->id === $schedule->user_id;
    }
}