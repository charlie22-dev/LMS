<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\PreviewStoredFile;
use App\Actions\StartSubmission;
use App\Actions\UploadSubmissionFile;
use App\Http\Requests\UploadSubmissionRequest;
use App\Models\Assignment;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubmissionFileController extends Controller
{
    public function startAndStore(Request $request, Assignment $assignment, StartSubmission $start, UploadSubmissionFile $upload): RedirectResponse
    {
        Gate::authorize('submit', $assignment);
        $request->validate(['file' => ['required', 'file', 'mimes:pdf,txt,doc,docx,ppt,pptx,jpg,jpeg,png,zip', 'max:20480']]);
        $submission = $start->handle($request->user(), $assignment);
        $upload->handle($request->user(), $submission, $request->file('file'));

        return to_route('assignments.show', $assignment)->with('success', 'Your draft file has been saved. Turn it in when ready.');
    }

    public function download(Request $request, Submission $submission): StreamedResponse
    {
        Gate::authorize('view', $submission);
        abort_if($submission->file_url === null || ! Storage::disk('local')->exists($submission->file_url), 404);

        if ($request->boolean('preview')) {
            return app(PreviewStoredFile::class)->handle($submission->file_url, $submission->file_name);
        }

        return Storage::disk('local')->download($submission->file_url, $submission->file_name, [
            'Content-Type' => 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function store(UploadSubmissionRequest $request, Submission $submission, UploadSubmissionFile $upload): RedirectResponse
    {
        $upload->handle($request->user(), $submission, $request->file('file'));

        return back()->with('success', 'Your draft file has been saved.');
    }
}
