<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\SubmissionStatus;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

final class TurnInSubmission
{
    public function handle(User $student, Submission $submission): Submission
    {
        return DB::transaction(function () use ($student, $submission): Submission {
            $locked = Submission::query()->lockForUpdate()->findOrFail($submission->id);
            Gate::forUser($student)->authorize('turnIn', $locked);

            if ($locked->file_url === null || ! Storage::disk('local')->exists($locked->file_url)) {
                throw ValidationException::withMessages(['submission' => 'Upload and save a file before turning in your work.']);
            }

            $locked->status = SubmissionStatus::Submitted;
            $locked->submitted_at = now();
            $locked->save();

            return $locked;
        }, 3);
    }
}
