<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FirebaseLoginTest extends TestCase
{
    use RefreshDatabase;

    private string $privateKey;

    protected function setUp(): void
    {
        parent::setUp();
        config(['firebase.project_id' => 'test-project']);
        $options = $this->opensslOptions();
        $key = openssl_pkey_new($options);
        openssl_pkey_export($key, $privateKey, null, $options);
        $this->privateKey = $privateKey;
        $publicKey = openssl_pkey_get_details($key)['key'];
        Cache::forget('firebase_signing_certificates');
        Http::fake(['www.googleapis.com/*' => Http::response(['test-key' => $publicKey], 200, ['Cache-Control' => 'public, max-age=3600'])]);
    }

    public function test_verified_google_token_creates_a_student_and_session(): void
    {
        $response = $this->postJson(route('firebase.login'), ['credential' => $this->token()]);
        $response->assertOk()->assertJsonPath('redirect', route('classrooms.index'));
        $user = User::query()->where('firebase_uid', 'firebase-user-123')->firstOrFail();
        $this->assertSame(UserRole::Student, $user->role);
        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_existing_account_is_never_automatically_linked_by_email(): void
    {
        $user = User::factory()->create(['email' => 'learner@example.com', 'role' => UserRole::Teacher]);
        $this->postJson(route('firebase.login'), ['credential' => $this->token()])->assertUnprocessable()->assertJsonValidationErrors('credential');
        $this->assertNull($user->fresh()->firebase_uid);
        $this->assertGuest();
    }

    private function token(array $overrides = [], ?string $key = null): string
    {
        return JWT::encode(array_replace([
            'iss' => 'https://securetoken.google.com/test-project', 'aud' => 'test-project',
            'iat' => time() - 30, 'auth_time' => time() - 30, 'exp' => time() + 3600,
            'sub' => 'firebase-user-123', 'email' => 'learner@example.com', 'email_verified' => true,
            'name' => 'Example Learner', 'firebase' => ['sign_in_provider' => 'google.com'],
        ], $overrides), $key ?? $this->privateKey, 'RS256', 'test-key');
    }

    private function opensslOptions(): array
    {
        $options = ['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA];
        $xamppConfig = dirname(PHP_BINARY).'/extras/ssl/openssl.cnf';
        if (is_file($xamppConfig)) {
            $options['config'] = $xamppConfig;
        }

        return $options;
    }
}
