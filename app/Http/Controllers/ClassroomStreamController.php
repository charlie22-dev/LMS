<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Classroom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClassroomStreamController extends Controller
{
    public function index(Request $request, Classroom $classroom): Response
    {
        Gate::authorize('view', $classroom);
        $classroom->load('teacher:id,name')->loadCount('students');

        return Inertia::render('Classroom/Stream', [
            'classroom' => [
                'id' => $classroom->id,
                'name' => $classroom->name,
                'section' => $classroom->section,
                'teacher' => $classroom->teacher->only('id', 'name'),
                'students_count' => $classroom->students_count,
                'invite_code' => $request->user()->id === $classroom->teacher_id ? $classroom->invite_code : null,
                'can_manage' => Gate::allows('manage', $classroom),
            ],
            'streamItems' => fn () => $classroom->assignments()
                ->select(['id', 'classroom_id', 'author_id', 'title', 'instructions', 'points', 'due_at', 'created_at'])
                ->with('author:id,name')
                ->orderByDesc('id')
                ->cursorPaginate(20)
                ->through(fn (Assignment $assignment): array => [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'instructions' => $assignment->instructions,
                    'points' => $assignment->points,
                    'due_at' => $assignment->due_at?->toIso8601String(),
                    'created_at' => $assignment->created_at->toIso8601String(),
                    'author' => $assignment->author->only('id', 'name'),
                ]),
        ]);
    }
}
