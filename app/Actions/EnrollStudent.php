<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\UserRole;
use App\Models\Classroom;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class EnrollStudent
{
    public function handle(User $student, string $code): Classroom
    {
        abort_unless($student->role === UserRole::Student, 403);
        $classroom = Classroom::query()->where('invite_code', strtoupper(trim($code)))->first();

        if ($classroom === null) {
            throw ValidationException::withMessages(['invite_code' => 'No classroom matches this invitation code.']);
        }

        // The composite primary key + ON CONFLICT DO NOTHING makes concurrent joins idempotent.
        DB::table('classroom_user')->insertOrIgnore([
            'classroom_id' => $classroom->id,
            'user_id' => $student->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $classroom;
    }
}
