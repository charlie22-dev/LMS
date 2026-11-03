<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Assignment;
use App\Models\Classroom;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

final class CreateAssignment
{
    public function handle(User $teacher, Classroom $classroom, string $title, ?string $instructions, int $points, ?string $dueAt, string $type = 'assignment', array $files = []): Assignment
    {
        Gate::forUser($teacher)->authorize('manage', $classroom);
        if (! in_array($type, ['assignment', 'material', 'announcement'], true)) {
            throw ValidationException::withMessages(['type' => 'Choose a valid post type.']);
        }
        $paths = [];
        try {
            foreach ($files as $file) {
                $path = $file->store('classroom-attachments/'.$classroom->id, 'local');
                if ($path === false) {
                    throw ValidationException::withMessages(['files' => 'The attachment could not be saved. Try again.']);
                }
                $paths[] = ['path' => $path, 'name' => mb_substr(basename(str_replace('\\', '/', $file->getClientOriginalName())), 0, 255), 'size' => $file->getSize()];
            }

            return DB::transaction(function () use ($teacher, $classroom, $title, $instructions, $points, $dueAt, $type, $paths): Assignment {
                $assignment = new Assignment([
                    'type' => $type,
                    'title' => $title,
                    'instructions' => $instructions,
                    'points' => $type === 'assignment' ? $points : 0,
                    'due_at' => $type !== 'assignment' || $dueAt === null ? null : CarbonImmutable::parse($dueAt)->utc(),
                ]);
                $assignment->author()->associate($teacher);
                $assignment->classroom()->associate($classroom);
                $assignment->save();

                $assignment->attachments()->createMany($paths);

                return $assignment;
            });
        } catch (Throwable $exception) {
            Storage::disk('local')->delete(array_column($paths, 'path'));
            throw $exception;
        }
    }
}
