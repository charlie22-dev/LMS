<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Assignment;
use App\Models\Classroom;
use App\Models\Submission;
use App\Observers\AssignmentObserver;
use App\Policies\ClassroomPolicy;
use App\Policies\SubmissionPolicy;
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
        Gate::policy(Classroom::class, ClassroomPolicy::class);
        Gate::policy(Submission::class, SubmissionPolicy::class);
        Assignment::observe(AssignmentObserver::class);
        RateLimiter::for('login', fn (Request $request): Limit => Limit::perMinute(5)->by((string) $request->ip()));
        RateLimiter::for('enrollment', fn (Request $request): Limit => Limit::perMinute(10)->by((string) ($request->user()?->id ?? $request->ip())));
    }
}
