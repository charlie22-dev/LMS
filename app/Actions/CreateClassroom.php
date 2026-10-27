<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\UserRole;
use App\Models\Classroom;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

final class CreateClassroom
{
    public function handle(User $teacher, string $name, ?string $section = null): Classroom
    {
        abort_unless($teacher->role === UserRole::Teacher, 403);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            try {
                // A separate transaction/savepoint permits retry after a PostgreSQL unique violation.
                return DB::transaction(function () use ($teacher, $name, $section): Classroom {
                    return $teacher->teachingClassrooms()->create(['name' => $name, 'section' => $section]);
                });
            } catch (UniqueConstraintViolationException $exception) {
                if ($attempt === 4) {
                    throw $exception;
                }
            }
        }

        throw new \LogicException('Classroom creation exhausted its retry budget.');
    }
}
