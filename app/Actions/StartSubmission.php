<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Assignment;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class StartSubmission
{
    public function handle(User $student, Assignment $assignment): Submission
    {
        Gate::forUser($student)->authorize('submit', $assignment);
        DB::table('submissions')->insertOrIgnore([
            'assignment_id' => $assignment->id,
            'user_id' => $student->id,
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $assignment->submissions()->where('user_id', $student->id)->firstOrFail();
    }
}
