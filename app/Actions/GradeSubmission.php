<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\SubmissionStatus;
use App\Models\Assignment;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class GradeSubmission
{
    public function handle(User $teacher, Submission $submission, string $grade, ?string $feedback): Submission
    {
        Gate::forUser($teacher)->authorize('grade', $submission);

        return DB::transaction(function () use ($teacher, $submission, $grade, $feedback): Submission {
            // Serialize grade writes for this assignment, including the cached aggregate.
            // Always take the assignment lock before the submission lock.
            $assignment = Assignment::query()->lockForUpdate()->findOrFail($submission->assignment_id);
            $locked = Submission::query()->lockForUpdate()->findOrFail($submission->id);
            Gate::forUser($teacher)->authorize('grade', $locked);

            if (! is_numeric($grade) || (float) $grade < 0 || (float) $grade > $assignment->points) {
                throw ValidationException::withMessages(['grade' => 'The grade must be between 0 and '.$assignment->points.'.']);
            }

            $locked->grade = $grade;
            $locked->feedback = $feedback;
            $locked->graded_at = now();
            $locked->graded_by = $teacher->id;
            $locked->status = SubmissionStatus::Graded;
            $locked->save();

            $assignment->class_average = $assignment->submissions()
                ->whereIn('status', [SubmissionStatus::Graded->value, SubmissionStatus::Returned->value])
                ->avg('grade');
            // A private grade change must not invalidate the public classroom stream.
            $assignment->saveQuietly();

            return $locked;
        }, 3);
    }
}
