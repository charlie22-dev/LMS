<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Assignment;
use App\Models\Classroom;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Gate;

final class CreateAssignment
{
    public function handle(User $teacher, Classroom $classroom, string $title, ?string $instructions, int $points, ?string $dueAt): Assignment
    {
        Gate::forUser($teacher)->authorize('manage', $classroom);
        $assignment = new Assignment([
            'title' => $title,
            'instructions' => $instructions,
            'points' => $points,
            'due_at' => $dueAt === null ? null : CarbonImmutable::parse($dueAt)->utc(),
        ]);
        $assignment->author()->associate($teacher);
        $assignment->classroom()->associate($classroom);
        $assignment->save();

        return $assignment;
    }
}
