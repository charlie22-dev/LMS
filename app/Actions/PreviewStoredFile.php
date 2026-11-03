<?php

declare(strict_types=1);

namespace App\Actions;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class PreviewStoredFile
{
    public function handle(string $path, string $name): StreamedResponse
    {
        $disk = Storage::disk('local');
        $mime = $disk->mimeType($path);
        // Only inert formats may be rendered in the authenticated app origin.
        abort_unless(in_array($mime, ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'], true), 415, 'This file format cannot be previewed.');

        return $disk->response($path, $name, [
            'Content-Type' => $mime,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
            'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'",
        ], 'inline');
    }
}
