<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\SubmissionStatus;
use App\Enums\UserRole;
use App\Models\Assignment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkListController extends Controller
{
    public function index(Request $request, string $view): Response
    {
        $user = $request->user();
        $query = Assignment::query()->select(['id', 'classroom_id', 'title', 'points', 'due_at'])
            ->with('classroom:id,name')
            ->when($user->role === UserRole::Student, fn (Builder $builder) => $builder->whereHas('classroom.students', fn (Builder $students) => $students->whereKey($user->id)))
            ->when($user->role === UserRole::Teacher, fn (Builder $builder) => $builder->whereHas('classroom', fn (Builder $classrooms) => $classrooms->where('teacher_id', $user->id)));

        if ($view === 'todo' && $user->role === UserRole::Student) {
            $query->whereDoesntHave('submissions', fn (Builder $submissions) => $submissions->where('user_id', $user->id)->where('status', '!=', SubmissionStatus::Draft->value));
        }
        if ($view === 'calendar') {
            $query->whereNotNull('due_at')->orderBy('due_at')->orderBy('id');
        } else {
            $query->orderByDesc('id');
        }

        return Inertia::render('Work/Index', [
            'view' => $view,
            'items' => $query->cursorPaginate(30)->through(fn (Assignment $assignment): array => [
                'id' => $assignment->id, 'title' => $assignment->title, 'points' => $assignment->points,
                'due_at' => $assignment->due_at?->toIso8601String(), 'classroom' => $assignment->classroom->only('id', 'name'),
            ]),
        ]);
    }
}
