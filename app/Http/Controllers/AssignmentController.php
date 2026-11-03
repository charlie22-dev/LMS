<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateAssignment;
use App\Enums\SubmissionStatus;
use App\Enums\UserRole;
use App\Http\Requests\StoreAssignmentRequest;
use App\Models\Assignment;
use App\Models\Classroom;
use App\Models\ClassroomComment;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    public function store(StoreAssignmentRequest $request, Classroom $classroom, CreateAssignment $create): RedirectResponse
    {
        $assignment = $create->handle(
            $request->user(), $classroom, $request->validated('title'),
            $request->validated('instructions'), (int) $request->validated('points'), $request->validated('due_at'), $request->validated('type', 'assignment'), $request->file('files', []),
        );

        return to_route('assignments.show', $assignment)->with('success', ucfirst($assignment->type).' posted to the classroom.');
    }

    public function show(Request $request, Assignment $assignment): Response
    {
        $assignment->load(['classroom', 'author:id,name', 'attachments']);
        Gate::authorize('view', $assignment);
        $canReview = Gate::allows('review', $assignment);
        $canSubmit = Gate::allows('submit', $assignment);
        $ownSubmission = $canSubmit ? $assignment->submissions()->where('user_id', $request->user()->id)->first() : null;

        $canManage = Gate::allows('manage', $assignment->classroom);
        $isStudent = $request->user()->role === UserRole::Student;
        $students = $assignment->type === 'assignment' && $canManage
            ? $assignment->classroom->students()->orderBy('name')->get(['users.id', 'users.name']) : collect();
        $selectedStudent = $assignment->type !== 'assignment' ? null : ($isStudent ? $request->user()->id : ($canManage ? $request->integer('student', $students->first()?->id ?? 0) : null));
        if ($canManage && $selectedStudent) {
            abort_unless($students->contains('id', $selectedStudent), 404);
        }
        $commentData = fn (ClassroomComment $comment): array => [
            'id' => $comment->id, 'body' => $comment->body,
            'author' => $comment->user->only('id', 'name'),
            'created_at' => $comment->created_at->toIso8601String(),
            'can_delete' => $comment->user_id === $request->user()->id || $canManage,
        ];

        return Inertia::render('Assignment/Show', [
            'classComments' => fn () => $assignment->comments()->whereNull('student_id')->with('user:id,name')->orderByDesc('id')
                ->cursorPaginate(30, ['*'], 'class_cursor')->withQueryString()->through($commentData),
            'privateComments' => fn () => $selectedStudent ? $assignment->comments()->where('student_id', $selectedStudent)->with('user:id,name')->orderByDesc('id')
                ->cursorPaginate(30, ['*'], 'private_cursor')->withQueryString()->through($commentData) : null,
            'commentSettings' => [
                'can_post' => $isStudent || $canManage,
                'students' => $students->map(fn ($student): array => $student->only('id', 'name'))->values()->all(),
                'student_id' => $selectedStudent ?: null, 'can_manage' => $canManage,
            ],
            'assignment' => [
                'id' => $assignment->id,
                'type' => $assignment->type,
                'attachments' => $assignment->attachments->map(fn ($attachment): array => $attachment->toDownloadData())->all(),
                'title' => $assignment->title,
                'instructions' => $assignment->instructions,
                'points' => $assignment->points,
                'due_at' => $assignment->due_at?->toIso8601String(),
                'author' => $assignment->author->only('id', 'name'),
                'classroom' => $assignment->classroom->only('id', 'name'),
                'class_average' => $canReview ? $assignment->class_average : null,
            ],
            'permissions' => ['review' => $canReview, 'submit' => $canSubmit],
            'submission' => $ownSubmission === null ? null : $this->submissionData($ownSubmission, false),
            'submissions' => fn () => $canReview ? $assignment->submissions()
                ->where('status', '!=', SubmissionStatus::Draft->value)
                ->with('user:id,name')->orderByDesc('id')->cursorPaginate(20)
                ->through(fn (Submission $submission): array => [
                    ...$this->submissionData($submission, true),
                    'student' => $submission->user->only('id', 'name'),
                ]) : null,
        ]);
    }

    private function submissionData(Submission $submission, bool $reviewer): array
    {
        $released = $reviewer || $submission->status === SubmissionStatus::Returned;

        return [
            'id' => $submission->id,
            'status' => $submission->status->value,
            'file_name' => $submission->file_name,
            'download_url' => $submission->file_url === null ? null : route('submissions.download', $submission),
            'submitted_at' => $submission->submitted_at?->toIso8601String(),
            'returned_at' => $submission->returned_at?->toIso8601String(),
            'grade' => $released ? $submission->grade : null,
            'feedback' => $released ? $submission->feedback : null,
            'can_upload' => ! $reviewer && $submission->status === SubmissionStatus::Draft,
            'can_grade' => $reviewer && in_array($submission->status, [SubmissionStatus::Submitted, SubmissionStatus::Graded], true),
            'can_return' => $reviewer && $submission->status === SubmissionStatus::Graded,
        ];
    }
}
