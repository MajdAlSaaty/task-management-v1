<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ConflictLog;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ConflictController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the user's conflict logs.
     */
    public function index(Request $request)
    {
        $query = ConflictLog::where('user_id', $request->user()->id)
            ->with(['task1', 'task2'])
            ->orderBy('created_at', 'desc');

        if ($request->has('conflict_type')) {
            $query->where('conflict_type', $request->conflict_type);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Display the specified conflict log.
     */
    public function show(ConflictLog $conflictLog)
    {
        $this->authorize('view', $conflictLog);
        return response()->json($conflictLog->load(['task1', 'task2']));
    }

    /**
     * Delete a conflict log entry.
     */
    public function destroy(ConflictLog $conflictLog)
    {
        $this->authorize('delete', $conflictLog);
        $conflictLog->delete();
        return response()->json(null, 204);
    }
}