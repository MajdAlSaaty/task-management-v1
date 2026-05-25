<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class NotificationController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the user's notifications.
     */
    public function index(Request $request)
    {
        $query = $request->user()->notifications()->orderBy('scheduled_time', 'desc');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('is_read')) {
            $query->where('is_read', $request->boolean('is_read'));
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Display the specified notification.
     */
    public function show(Notification $notification)
    {
        $this->authorize('view', $notification);
        return response()->json($notification);
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(Notification $notification)
    {
        $this->authorize('update', $notification);
        $notification->update(['is_read' => true]);
        return response()->json($notification);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request)
    {
        $request->user()->notifications()->update(['is_read' => true]);
        return response()->json(['message' => 'تم تحديد جميع الإشعارات كمقروءة']);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Notification $notification)
    {
        $this->authorize('delete', $notification);
        $notification->delete();
        return response()->json(null, 204);
    }
}