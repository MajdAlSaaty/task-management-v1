<?php

namespace App\Providers;

use App\Models\Task;
use App\Models\ScheduledSlot;
use App\Models\UniversitySchedule;
use App\Models\ConflictLog;
use App\Models\Notification;
use App\Policies\TaskPolicy;
use App\Policies\ScheduledSlotPolicy;
use App\Policies\UniversitySchedulePolicy;
use App\Policies\ConflictLogPolicy;
use App\Policies\NotificationPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Task::class, TaskPolicy::class);
        Gate::policy(ScheduledSlot::class, ScheduledSlotPolicy::class);
        Gate::policy(UniversitySchedule::class, UniversitySchedulePolicy::class);
        Gate::policy(ConflictLog::class, ConflictLogPolicy::class);
        Gate::policy(Notification::class, NotificationPolicy::class);

        $isDev = !app()->environment('production');

        RateLimiter::for('login', function (Request $request) use ($isDev) {
            return Limit::perMinute($isDev ? 20 : 5)
                ->by($request->input('email') . '|' . $request->ip());
        });

        RateLimiter::for('register', function (Request $request) use ($isDev) {
            return Limit::perHour($isDev ? 20 : 3)->by($request->ip());
        });

        RateLimiter::for('password-forgot', function (Request $request) use ($isDev) {
            return Limit::perHour($isDev ? 10 : 3)->by($request->input('email'));
        });

        RateLimiter::for('password-reset', function (Request $request) use ($isDev) {
            return Limit::perHour($isDev ? 10 : 5)->by($request->ip());
        });
    }
}
