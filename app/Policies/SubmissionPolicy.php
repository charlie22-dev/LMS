<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\SubmissionStatus;
use App\Enums\UserRole;
use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    public function update(User $user, Submission $submission): bool
    {
        return $user->role === UserRole::Student
            && $submission->user_id === $user->id
            && $submission->status === SubmissionStatus::Draft
            && $submission->assignment->classroom->students()->whereKey($user->id)->exists();
    }

    public function upload(User $user, Submission $submission): bool
    {
        return $this->update($user, $submission);
    }
}
