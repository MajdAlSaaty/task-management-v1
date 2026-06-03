<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\EmailVerificationController;
use App\Http\Controllers\API\PasswordResetController;
use App\Http\Controllers\API\TaskController;
use App\Http\Controllers\API\ScheduledSlotController;
use App\Http\Controllers\API\UserDailyPreferenceController;
use App\Http\Controllers\API\UniversityScheduleController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\ConflictController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:register');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

// Password reset (public)
Route::post('/password/forgot', [PasswordResetController::class, 'forgot'])->middleware('throttle:password-forgot');
Route::post('/password/reset', [PasswordResetController::class, 'reset'])->middleware('throttle:password-reset');

// Email verification (signed URL — no auth middleware)
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

// Token refresh — must be outside auth:api to accept expired tokens
Route::post('/auth/refresh', [AuthController::class, 'refresh']);

// Protected routes (require valid JWT token)
Route::middleware('auth:api')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    // Email verification
    Route::post('/email/resend', [EmailVerificationController::class, 'resend'])->middleware('throttle:6,1');

    // Tasks
    Route::post('/tasks/auto-schedule-all', [TaskController::class, 'autoScheduleAll']);
    Route::post('/tasks/{task}/auto-schedule', [TaskController::class, 'autoSchedule']);
    Route::get('/tasks/{task}/weight', [TaskController::class, 'getTaskWeight']);
    Route::apiResource('tasks', TaskController::class);

    // User daily preferences
    Route::get('/preferences', [UserDailyPreferenceController::class, 'index']);
    Route::get('/preferences/{day}', [UserDailyPreferenceController::class, 'show']);
    Route::put('/preferences', [UserDailyPreferenceController::class, 'update']);
    Route::delete('/preferences/{day}', [UserDailyPreferenceController::class, 'destroy']);

    // Scheduled slots
    Route::apiResource('slots', ScheduledSlotController::class);

    // University Schedule
    Route::apiResource('university-schedule', UniversityScheduleController::class)
        ->parameters(['university-schedule' => 'schedule']);

    // Notifications
    Route::get("/notifications", [NotificationController::class, "index"]);
    Route::get("/notifications/{notification}", [NotificationController::class, "show"]);
    Route::put("/notifications/{notification}/read", [NotificationController::class, "markAsRead"]);
    Route::put("/notifications/read-all", [NotificationController::class, "markAllAsRead"]);
    Route::delete("/notifications", [NotificationController::class, "destroyAll"]);
    Route::delete("/notifications/{notification}", [NotificationController::class, "destroy"]);

    // Conflict Logs
    Route::get('/conflicts', [ConflictController::class, 'index']);
    Route::get('/conflicts/{conflictLog}', [ConflictController::class, 'show']);
    Route::delete('/conflicts/{conflictLog}', [ConflictController::class, 'destroy']);
});
