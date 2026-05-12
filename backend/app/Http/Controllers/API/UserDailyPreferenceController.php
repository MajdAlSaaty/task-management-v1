<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\UserDailyPreference;
use App\Services\OverlapHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserDailyPreferenceController extends Controller
{
    /**
     * Get all daily preferences for the authenticated user.
     */
    public function index()
    {
        $preferences = Auth::user()->dailyPreferences;
        return response()->json($preferences);
    }

    /**
     * Get a specific day's preference.
     */
    public function show($dayOfWeek)
    {
        $normalizedDay = ucfirst(strtolower($dayOfWeek));

        $preference = UserDailyPreference::where('user_id', Auth::id())
            ->where('day_of_week', $normalizedDay)
            ->first();

        if (!$preference) {
            return response()->json(['message' => 'Preference not found for this day'], 404);
        }

        return response()->json($preference);
    }

    /**
     * Create or update a preference for a specific day.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'preferred_start_time' => 'required|date_format:H:i',
            'preferred_end_time' => 'required|date_format:H:i|after:preferred_start_time',
            'daily_study_minutes_limit' => 'nullable|integer|min:1',
            'break_start_time' => 'nullable|date_format:H:i',
            'break_end_time' => 'nullable|date_format:H:i|after:break_start_time',
        ]);

        $userId = Auth::id();
        $dayOfWeek = $validated['day_of_week'];
        $prefStart = $validated['preferred_start_time'];
        $prefEnd = $validated['preferred_end_time'];

        if (OverlapHelper::checkUniversityScheduleOverlap($userId, $dayOfWeek, $prefStart, $prefEnd)) {
            return response()->json([
                'message' => 'ساعات الدراسة المحددة تتداخل مع جدول جامعي في نفس اليوم. يرجى تعديل الوقت.'
            ], 422);
        }

        if (!empty($validated['break_start_time']) && !empty($validated['break_end_time'])) {
            $breakStart = $validated['break_start_time'];
            $breakEnd = $validated['break_end_time'];

            if (OverlapHelper::checkUniversityScheduleOverlap($userId, $dayOfWeek, $breakStart, $breakEnd)) {
                return response()->json([
                    'message' => 'فترة الاستراحة المحددة تتداخل مع جدول جامعي في نفس اليوم. يرجى تعديل الوقت.'
                ], 422);
            }
        }

        $preference = UserDailyPreference::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'day_of_week' => $validated['day_of_week']
            ],
            $validated
        );

        return response()->json($preference);
    }

    /**
     * Delete a specific day's preference.
     */
    public function destroy($dayOfWeek)
    {
        $userId = Auth::id();
        $normalizedDay = ucfirst(strtolower($dayOfWeek));

        $preference = UserDailyPreference::where('user_id', $userId)
            ->where('day_of_week', $normalizedDay)
            ->first();

        if (!$preference) {
            return response()->json(['message' => 'Preference not found for this day'], 404);
        }

        $preference->delete();

        return response()->json(['message' => 'Preference deleted successfully']);
    }
}
