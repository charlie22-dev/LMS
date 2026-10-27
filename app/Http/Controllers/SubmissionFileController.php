<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\UploadSubmissionFile;
use App\Http\Requests\UploadSubmissionRequest;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;

class SubmissionFileController extends Controller
{
    public function store(UploadSubmissionRequest $request, Submission $submission, UploadSubmissionFile $upload): RedirectResponse
    {
        $upload->handle($request->user(), $submission, $request->file('file'));

        return back()->with('success', 'Your draft file has been saved.');
    }
}
