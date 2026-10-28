<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Assignment;
use App\Models\User;

class AssignmentPolicy
{
    public function view(User $user, Assignment $assignment): bool
    {
        return (new ClassroomPolicy)->view($user, $assignment->classroom);
    }

    public function submit(User $user, Assignment $assignment): bool
    {
        return $user->role === UserRole::Student
            && $assignment->classroom->students()->whereKey($user->id)->exists();
    }

    public function review(User $user, Assignment $assignment): bool
    {
        return (new ClassroomPolicy)->manage($user, $assignment->classroom);
    }
}
