<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\PreviewStoredFile;
use App\Models\ClassroomAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ClassroomAttachmentController extends Controller
{
    public function download(Request $request, ClassroomAttachment $attachment): StreamedResponse
    {
        Gate::authorize('view', $attachment->assignment);
        abort_unless(Storage::disk('local')->exists($attachment->path), 404);

        if ($request->boolean('preview')) {
            return app(PreviewStoredFile::class)->handle($attachment->path, $attachment->name);
        }

        return Storage::disk('local')->download($attachment->path, $attachment->name, [
            'Content-Type' => 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
