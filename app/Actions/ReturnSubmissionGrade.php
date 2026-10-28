<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\SubmissionStatus;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class ReturnSubmissionGrade
{
    public function handle(User $teacher, Submission $submission): Submission
    {
        return DB::transaction(function () use ($teacher, $submission): Submission {
            $locked = Submission::query()->lockForUpdate()->findOrFail($submission->id);
            Gate::forUser($teacher)->authorize('returnGrade', $locked);
            $locked->status = SubmissionStatus::Returned;
            $locked->returned_at = now();
            $locked->save();

            return $locked;
        }, 3);
    }
}
