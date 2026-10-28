<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\GradeSubmission;
use App\Actions\ReturnSubmissionGrade;
use App\Actions\StartSubmission;
use App\Actions\TurnInSubmission;
use App\Http\Requests\GradeSubmissionRequest;
use App\Models\Assignment;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SubmissionWorkflowController extends Controller
{
    public function draft(Request $request, Assignment $assignment, StartSubmission $start): RedirectResponse
    {
        $start->handle($request->user(), $assignment);

        return to_route('assignments.show', $assignment);
    }

    public function submit(Request $request, Submission $submission, TurnInSubmission $turnIn): RedirectResponse
    {
        $saved = $turnIn->handle($request->user(), $submission);

        return to_route('assignments.show', $saved->assignment_id)->with('success', 'Your work has been turned in and is now locked.');
    }

    public function grade(GradeSubmissionRequest $request, Submission $submission, GradeSubmission $grade): RedirectResponse
    {
        $grade->handle($request->user(), $submission, (string) $request->validated('grade'), $request->validated('feedback'));

        return back()->with('success', 'Grade saved. Return it when you are ready to share it with the student.');
    }

    public function returnGrade(Request $request, Submission $submission, ReturnSubmissionGrade $return): RedirectResponse
    {
        $return->handle($request->user(), $submission);

        return back()->with('success', 'Grade and feedback returned to the student.');
    }
}
