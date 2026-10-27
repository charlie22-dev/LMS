<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Actions\CreateClassroom;
use App\Actions\EnrollStudent;
use App\Enums\UserRole;
use App\Models\Assignment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class LmsDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Demo data is restricted to local and testing environments.');
        }

        $password = getenv('LMS_DEMO_PASSWORD');
        if ($password === false || strlen($password) < 12) {
            throw new RuntimeException('Set LMS_DEMO_PASSWORD to a password of at least 12 characters.');
        }

        DB::transaction(function () use ($password): void {
            $teacher = $this->user('teacher@classwork.test', 'Alex Rivera', UserRole::Teacher, $password);
            $student = $this->user('student@classwork.test', 'Sam Reyes', UserRole::Student, $password);
            $classroom = $teacher->teachingClassrooms()->where('name', 'Software Architecture')->first()
                ?? app(CreateClassroom::class)->handle($teacher, 'Software Architecture', 'BSCS · Section A');
            app(EnrollStudent::class)->handle($student, $classroom->invite_code);

            foreach ([
                ['Design your first domain model', "Map the users, classrooms, assignments, and submissions in a learning platform.\n\nIdentify ownership and lifecycle rules, then describe the foreign keys and indexes you would use.", 100],
                ['Think in transactions', "Explain how simultaneous requests can create duplicate enrollments.\n\nPropose a database constraint and an idempotent insert strategy. Include a short SQL example.", 50],
                ['Protect a submission lifecycle', "Design the allowed transitions between draft, submitted, graded, and returned.\n\nExplain where authorization and row locking belong in your implementation.", 100],
            ] as [$title, $instructions, $points]) {
                if ($classroom->assignments()->where('title', $title)->exists()) {
                    continue;
                }
                $assignment = new Assignment([
                    'title' => $title,
                    'instructions' => $instructions,
                    'points' => $points,
                    'due_at' => now()->addWeek()->setTime(23, 59),
                ]);
                $assignment->author()->associate($teacher);
                $classroom->assignments()->save($assignment);
            }
        });
    }

    private function user(string $email, string $name, UserRole $role, string $password): User
    {
        $user = User::query()->firstOrNew(['email' => $email]);
        $user->name = $name;
        $user->role = $role;
        $user->password = $password;
        $user->email_verified_at = now();
        $user->save();

        return $user;
    }
}
