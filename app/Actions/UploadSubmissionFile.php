<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

final class UploadSubmissionFile
{
    public function handle(User $student, Submission $submission, UploadedFile $file): Submission
    {
        Gate::forUser($student)->authorize('upload', $submission);
        $path = $file->store('submissions/'.$student->id, 'local');
        if ($path === false) {
            throw new RuntimeException('The submission file could not be stored.');
        }

        try {
            return DB::transaction(function () use ($student, $submission, $file, $path): Submission {
                $locked = Submission::query()->lockForUpdate()->findOrFail($submission->id);
                Gate::forUser($student)->authorize('upload', $locked);
                $locked->file_url = $path;
                $locked->file_name = mb_substr(basename(str_replace('\\', '/', $file->getClientOriginalName())), 0, 255);
                $locked->save();

                // Superseded objects are retained for scheduled orphan cleanup.
                // Deleting here could break an outer transaction that later rolls back.
                return $locked;
            }, 3);
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($path);
            throw $exception;
        }
    }
}
