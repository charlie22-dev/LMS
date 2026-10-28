<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateAssignment;
use App\Enums\SubmissionStatus;
use App\Http\Requests\StoreAssignmentRequest;
use App\Models\Assignment;
use App\Models\Classroom;
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
            $request->validated('instructions'), (int) $request->validated('points'), $request->validated('due_at'),
        );

        return to_route('assignments.show', $assignment)->with('success', 'Assignment posted to the classroom.');
    }

    public function show(Request $request, Assignment $assignment): Response
    {
        $assignment->load(['classroom', 'author:id,name']);
        Gate::authorize('view', $assignment);
        $canReview = Gate::allows('review', $assignment);
        $canSubmit = Gate::allows('submit', $assignment);
        $ownSubmission = $canSubmit ? $assignment->submissions()->where('user_id', $request->user()->id)->first() : null;

        return Inertia::render('Assignment/Show', [
            'assignment' => [
                'id' => $assignment->id,
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
