<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\TaskController;
use App\Http\Controllers\API\ScheduledSlotController;
use App\Http\Controllers\API\UserDailyPreferenceController;
use App\Http\Controllers\API\UniversityScheduleController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes (require valid JWT token)
Route::middleware('auth:api')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

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
});