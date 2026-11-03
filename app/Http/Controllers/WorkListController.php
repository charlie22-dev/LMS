<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\SubmissionStatus;
use App\Enums\UserRole;
use App\Models\Assignment;
use App\Models\Classroom;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WorkListController extends Controller
{
    public function index(Request $request, string $view): Response
    {
        $input = $request->validate(['classroom' => ['nullable', 'integer', 'min:1'], 'month' => ['nullable', 'date_format:Y-m', 'regex:/^[1-9][0-9]{3}-(0[1-9]|1[0-2])$/']]);
        $selectedClassroom = isset($input['classroom']) ? Classroom::query()->findOrFail($input['classroom']) : null;
        if ($selectedClassroom !== null) {
            Gate::authorize('view', $selectedClassroom);
        }
        $user = $request->user();
        $query = Assignment::query()->where('type', 'assignment')->select(['id', 'classroom_id', 'title', 'points', 'due_at'])
            ->with('classroom:id,name')
            ->when($selectedClassroom !== null, fn (Builder $builder) => $builder->where('classroom_id', $selectedClassroom->id))
            ->when($user->role === UserRole::Student, fn (Builder $builder) => $builder->whereHas('classroom.students', fn (Builder $students) => $students->whereKey($user->id)))
            ->when($user->role === UserRole::Teacher, fn (Builder $builder) => $builder->whereHas('classroom', fn (Builder $classrooms) => $classrooms->where('teacher_id', $user->id)));

        if ($view === 'todo' && $user->role === UserRole::Student) {
            $query->whereDoesntHave('submissions', fn (Builder $submissions) => $submissions->where('user_id', $user->id)->where('status', '!=', SubmissionStatus::Draft->value));
        }
        $month = $input['month'] ?? now()->format('Y-m');
        if ($view === 'calendar') {
            // Include a day on either side for grouping UTC deadlines in the browser's local timezone.
            $gridStart = CarbonImmutable::createFromFormat('!Y-m', $month, 'UTC')->startOfWeek(CarbonImmutable::SUNDAY);
            $query->where('due_at', '>=', $gridStart->subDay())->where('due_at', '<', $gridStart->addDays(43))
                ->orderBy('due_at')->orderBy('id');
        } else {
            $query->orderByDesc('id');
        }

        $serialize = fn (Assignment $assignment): array => [
            'id' => $assignment->id, 'title' => $assignment->title, 'points' => $assignment->points,
            'due_at' => $assignment->due_at?->toIso8601String(), 'classroom' => $assignment->classroom->only('id', 'name'),
        ];

        return Inertia::render('Work/Index', [
            'calendarMonth' => $month,
            'view' => $view,
            'selectedClassroom' => $selectedClassroom?->only('id', 'name'),
            'items' => $view === 'calendar'
                ? ['data' => $query->get()->map($serialize)->all(), 'next_page_url' => null, 'prev_page_url' => null]
                : $query->cursorPaginate(30)->withQueryString()->through($serialize),
        ]);
    }
}
