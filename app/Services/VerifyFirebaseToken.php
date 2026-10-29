<?php

declare(strict_types=1);

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Throwable;

final class VerifyFirebaseToken
{
    private const CERTIFICATES = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

    public function handle(string $token): object
    {
        $projectId = config('firebase.project_id');
        if (! is_string($projectId) || $projectId === '') {
            abort(503, 'Google sign-in is not configured.');
        }

        $certificates = Cache::get('firebase_signing_certificates');
        if (! is_array($certificates)) {
            try {
                $response = Http::timeout(5)->retry(2, 100)->get(self::CERTIFICATES)->throw();
                $certificates = $response->json();
                if (! is_array($certificates) || $certificates === []) {
                    throw new \RuntimeException('Empty Firebase certificate response.');
                }
                preg_match('/max-age=(\d+)/', $response->header('Cache-Control') ?? '', $matches);
                Cache::put('firebase_signing_certificates', $certificates, max(1, min((int) ($matches[1] ?? 300), 86400)));
            } catch (Throwable) {
                abort(503, 'Google sign-in is temporarily unavailable.');
            }
        }

        try {
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                throw new \UnexpectedValueException;
            }
            $header = json_decode(JWT::urlsafeB64Decode($parts[0]), false, 512, JSON_THROW_ON_ERROR);
            if (($header->alg ?? null) !== 'RS256' || ! is_string($header->kid ?? null) || ! isset($certificates[$header->kid]) || ! is_string($certificates[$header->kid])) {
                throw new \UnexpectedValueException;
            }
            $claims = JWT::decode($token, new Key($certificates[$header->kid], 'RS256'));
            if (($claims->aud ?? null) !== $projectId || ($claims->iss ?? null) !== 'https://securetoken.google.com/'.$projectId
                || ! is_string($claims->sub ?? null) || $claims->sub === '' || strlen($claims->sub) > 128
                || ! is_numeric($claims->iat ?? null) || $claims->iat > time()
                || ! is_numeric($claims->auth_time ?? null) || $claims->auth_time > time()
                || ! is_numeric($claims->exp ?? null) || $claims->exp <= time()
                || ($claims->firebase->sign_in_provider ?? null) !== 'google.com'
                || ($claims->email_verified ?? false) !== true || ! filter_var($claims->email ?? null, FILTER_VALIDATE_EMAIL)
                || strlen($claims->email) > 255) {
                throw new \UnexpectedValueException;
            }

            return $claims;
        } catch (Throwable) {
            throw ValidationException::withMessages(['credential' => 'Google sign-in could not be verified. Please try again.']);
        }
    }
}
