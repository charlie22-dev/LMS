<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Classroom;
use App\Models\User;

class ClassroomPolicy
{
    public function create(User $user): bool
    {
        return $user->role === UserRole::Teacher;
    }

    public function manage(User $user, Classroom $classroom): bool
    {
        return $user->role === UserRole::Teacher && $classroom->teacher_id === $user->id;
    }

    public function view(User $user, Classroom $classroom): bool
    {
        return $user->role === UserRole::Admin
            || ($user->role === UserRole::Teacher && $classroom->teacher_id === $user->id)
            || ($user->role === UserRole::Student && $classroom->students()->whereKey($user->id)->exists());
    }
}
