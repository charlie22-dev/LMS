<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\UploadSubmissionFile;
use App\Http\Requests\UploadSubmissionRequest;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubmissionFileController extends Controller
{
    public function download(Submission $submission): StreamedResponse
    {
        Gate::authorize('view', $submission);
        abort_if($submission->file_url === null || ! Storage::disk('local')->exists($submission->file_url), 404);

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
