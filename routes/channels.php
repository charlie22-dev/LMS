<?php

declare(strict_types=1);

use App\Models\Classroom;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Gate;

Broadcast::channel('classrooms.{classroomId}', function (User $user, string $classroomId): bool {
    $classroom = Classroom::query()->find($classroomId);

    return $classroom !== null && Gate::forUser($user)->allows('view', $classroom);
});
