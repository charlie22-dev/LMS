<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\SubmissionStatus;
use App\Enums\UserRole;
use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    public function view(User $user, Submission $submission): bool
    {
        if ($user->role === UserRole::Student) {
            return $submission->user_id === $user->id
                && (new AssignmentPolicy)->submit($user, $submission->assignment);
        }

        return $submission->status !== SubmissionStatus::Draft
            && ($user->role === UserRole::Admin
                || (new AssignmentPolicy)->review($user, $submission->assignment));
    }

    public function turnIn(User $user, Submission $submission): bool
    {
        return $this->update($user, $submission);
    }

    public function grade(User $user, Submission $submission): bool
    {
        return (new AssignmentPolicy)->review($user, $submission->assignment)
            && in_array($submission->status, [SubmissionStatus::Submitted, SubmissionStatus::Graded], true);
    }

    public function returnGrade(User $user, Submission $submission): bool
    {
        return (new AssignmentPolicy)->review($user, $submission->assignment)
            && $submission->status === SubmissionStatus::Graded;
    }

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
