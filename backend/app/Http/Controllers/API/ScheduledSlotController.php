<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ScheduledSlot;
use App\Services\SchedulingEngine;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ScheduledSlotController extends Controller
{
    use AuthorizesRequests;

    protected $schedulingEngine;

    public function __construct(SchedulingEngine $schedulingEngine)
    {
        $this->schedulingEngine = $schedulingEngine;
    }

    /**
     * List all scheduled slots for the user.
     * Optional filter by date.
     */
    public function index(Request $request)
    {
        $query = ScheduledSlot::with('task')
            ->where('user_id', Auth::id());

        if ($request->has('date')) {
            $query->whereDate('start_time', $request->date);
        }

        return response()->json($query->orderBy('start_time')->paginate(20));
    }

    /**
     * Create a new scheduled slot (manual scheduling).
     * Checks for conflicts before saving.
     */
    public function store(Request $request)
    {
        $userId = Auth::id();

        $validated = $request->validate([
            'task_id' => [
                'required',
                Rule::exists('tasks', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
            ],
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ]);
        
        // Check for overlapping slots
        $conflicts = ScheduledSlot::overlapping(
            $userId,
            $validated['start_time'],
            $validated['end_time']
        )->exists();

        if ($conflicts) {
            return response()->json([
                'error' => 'This time slot overlaps with an existing scheduled task.'
            ], 422);
        }

        $slot = ScheduledSlot::create([
            'user_id' => $userId,
            'task_id' => $validated['task_id'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'status' => 'scheduled',
        ]);

        // Update task status if needed
        $task = $slot->task;
        if ($task && $task->status === 'pending') {
            $task->update(['status' => 'in_progress']);
        }

        return response()->json($slot, 201);
    }

    /**
     * Display the specified scheduled slot.
     */
    public function show(ScheduledSlot $slot)
    {
        $this->authorize('view', $slot);
        return response()->json($slot->load('task'));
    }

    /**
     * Update the specified scheduled slot.
     */
    public function update(Request $request, ScheduledSlot $slot)
    {
        $this->authorize('update', $slot);

        $validated = $request->validate([
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'status' => 'sometimes|in:scheduled,completed,missed,cancelled',
        ]);

        $userId = Auth::id();

        if (isset($validated['start_time']) && isset($validated['end_time'])) {
            $conflicts = ScheduledSlot::overlapping(
                $userId,
                $validated['start_time'],
                $validated['end_time'],
                $slot->id
            )->exists();

            if ($conflicts) {
                return response()->json([
                    'error' => 'This time slot overlaps with an existing scheduled task.'
                ], 422);
            }
        }

        $slot->update($validated);
        return response()->json($slot);
    }

    /**
     * Remove the specified scheduled slot.
     */
    public function destroy(ScheduledSlot $slot)
    {
        $this->authorize('delete', $slot);
        $slot->delete();
        return response()->json(null, 204);
    }
}