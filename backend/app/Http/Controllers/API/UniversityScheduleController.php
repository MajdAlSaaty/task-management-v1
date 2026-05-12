<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\UniversitySchedule;
use App\Services\OverlapHelper;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UniversityScheduleController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the user's university schedule entries.
     */
    public function index()
    {
        $this->authorize('viewAny', UniversitySchedule::class);

        $schedules = UniversitySchedule::query()
            ->where('user_id', Auth::id())
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json($schedules);
    }

    /**
     * Store a newly created university schedule entry.
     */
    public function store(Request $request)
    {
        $this->authorize('create', UniversitySchedule::class);
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'day_of_week' => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'valid_from' => 'required|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
        ]);

        $userId = Auth::id();
        $dayOfWeek = $validated['day_of_week'];
        $uniStart = $validated['start_time'];
        $uniEnd = $validated['end_time'];

        $overlapType = OverlapHelper::checkPreferenceOverlap($userId, $dayOfWeek, $uniStart, $uniEnd);

        if ($overlapType) {
            $message = $overlapType === 'study_hours'
                ? 'يتداخل وقت هذه المحاضرة مع ساعات الدراسة المحددة في هذا اليوم.'
                : 'يتداخل وقت هذه المحاضرة مع فترة الاستراحة المحددة في هذا اليوم.';
            return response()->json(['message' => $message], 422);
        }

        $validated['user_id'] = $userId;
        $schedule = UniversitySchedule::create($validated);

        return response()->json($schedule, 201);
    }

    /**
     * Display the specified university schedule entry.
     */
    public function show(UniversitySchedule $schedule)
    {
        $this->authorize('view', $schedule);
        return response()->json($schedule);
    }

    /**
     * Update the specified university schedule entry.
     */
    public function update(Request $request, UniversitySchedule $schedule)
    {
        $this->authorize('update', $schedule);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'day_of_week' => 'sometimes|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i|after:start_time',
            'valid_from' => 'sometimes|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
        ]);

        $userId = Auth::id();
        $dayOfWeek = $validated['day_of_week'] ?? $schedule->day_of_week;
        $uniStart = $validated['start_time'] ?? $schedule->start_time;
        $uniEnd = $validated['end_time'] ?? $schedule->end_time;

        $uniStart = substr($uniStart, 0, 5);
        $uniEnd = substr($uniEnd, 0, 5);

        $overlapType = OverlapHelper::checkPreferenceOverlap($userId, $dayOfWeek, $uniStart, $uniEnd);

        if ($overlapType) {
            $message = $overlapType === 'study_hours'
                ? 'يتداخل وقت هذه المحاضرة مع ساعات الدراسة المحددة في هذا اليوم.'
                : 'يتداخل وقت هذه المحاضرة مع فترة الاستراحة المحددة في هذا اليوم.';
            return response()->json(['message' => $message], 422);
        }

        $schedule->update($validated);
        return response()->json($schedule);
    }

    /**
     * Remove the specified university schedule entry.
     */
    public function destroy(UniversitySchedule $schedule)
    {
        $this->authorize('delete', $schedule);
        $schedule->delete();
        return response()->json(null, 204);
    }
}