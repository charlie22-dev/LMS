<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\VerifyFirebaseToken;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class FirebaseSessionController extends Controller
{
    public function store(Request $request, VerifyFirebaseToken $verify): JsonResponse
    {
        $data = $request->validate(['credential' => ['required', 'string', 'max:16384']]);
        $claims = $verify->handle($data['credential']);
        $user = User::query()->where('firebase_uid', $claims->sub)->first();

        if ($user === null) {
            if (User::query()->where('email', $claims->email)->exists()) {
                throw ValidationException::withMessages(['credential' => 'An account already uses this email. Sign in with your existing credentials.']);
            }

            $user = new User;
            $user->name = mb_substr(is_string($claims->name ?? null) && trim($claims->name) !== '' ? trim($claims->name) : 'Student', 0, 255);
            $user->email = $claims->email;
            $user->firebase_uid = $claims->sub;
            $user->email_verified_at = now();
            $user->password = Str::random(64);
            $user->role = UserRole::Student;
            try {
                $user->save();
            } catch (UniqueConstraintViolationException) {
                // Concurrent sign-ins may race to create the same Firebase identity.
                $user = User::query()->where('firebase_uid', $claims->sub)->first();
                if ($user === null) {
                    throw ValidationException::withMessages(['credential' => 'An account already uses this email. Sign in with your existing credentials.']);
                }
            }
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['redirect' => route('classrooms.index')]);
    }
}
