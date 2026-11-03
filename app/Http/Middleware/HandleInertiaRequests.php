<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Models\Classroom;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => ['user' => fn () => $request->user()?->only('id', 'name', 'email', 'role')],
            'navigationClassrooms' => function () use ($request): array {
                $user = $request->user();
                if ($user === null || ! in_array($user->role, [UserRole::Student, UserRole::Teacher], true)) {
                    return [];
                }

                return Classroom::query()->select(['id', 'name', 'section'])
                    ->when($user->role === UserRole::Teacher, fn (Builder $query) => $query->where('teacher_id', $user->id))
                    ->when($user->role === UserRole::Student, fn (Builder $query) => $query->whereHas('students', fn (Builder $students) => $students->whereKey($user->id)))
                    ->orderBy('name')->orderBy('id')->get()->toArray();
            },
            'flash' => ['success' => fn () => $request->session()->get('success')],
        ];
    }
}
