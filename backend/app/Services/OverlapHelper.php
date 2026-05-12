<?php

namespace App\Services;

use App\Models\UniversitySchedule;
use App\Models\UserDailyPreference;

class OverlapHelper
{
    /**
     * Check if a time range overlaps with any university schedule for a given day.
     */
    public static function checkUniversityScheduleOverlap(int $userId, string $dayOfWeek, string $startTime, string $endTime, ?int $excludeId = null): bool
    {
        return UniversitySchedule::where('user_id', $userId)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime, $endTime])
                      ->orWhereBetween('end_time', [$startTime, $endTime])
                      ->orWhere(function ($q) use ($startTime, $endTime) {
                          $q->where('start_time', '<', $startTime)
                            ->where('end_time', '>', $endTime);
                      });
            })
            ->when($excludeId, function ($query) use ($excludeId) {
                $query->where('id', '!=', $excludeId);
            })
            ->exists();
    }

    /**
     * Check if a time range overlaps with user daily preference study hours or break time.
     */
    public static function checkPreferenceOverlap(int $userId, string $dayOfWeek, string $startTime, string $endTime): ?string
    {
        $preference = UserDailyPreference::where('user_id', $userId)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if (!$preference) {
            return null;
        }

        $prefStart = substr($preference->preferred_start_time, 0, 5);
        $prefEnd = substr($preference->preferred_end_time, 0, 5);

        $studyOverlap = ($startTime < $prefEnd && $endTime > $prefStart);

        if ($studyOverlap) {
            return 'study_hours';
        }

        if ($preference->break_start_time && $preference->break_end_time) {
            $breakStart = substr($preference->break_start_time, 0, 5);
            $breakEnd = substr($preference->break_end_time, 0, 5);
            $breakOverlap = ($startTime < $breakEnd && $endTime > $breakStart);

            if ($breakOverlap) {
                return 'break_time';
            }
        }

        return null;
    }
}