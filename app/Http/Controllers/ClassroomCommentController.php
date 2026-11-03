<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Assignment;
use App\Models\ClassroomComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ClassroomCommentController extends Controller
{
    public function store(Request $request, Assignment $assignment): RedirectResponse
    {
        Gate::authorize('view', $assignment);
        $user = $request->user();
        abort_unless($user->role === UserRole::Student || Gate::allows('manage', $assignment->classroom), 403);
        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'visibility' => ['required', 'in:class,private'],
            'student_id' => ['nullable', 'integer', 'min:1'],
        ]);
        $body = trim($data['body']);
        if ($body === '') {
            throw ValidationException::withMessages(['body' => 'Write a comment before posting.']);
        }
        $studentId = null;
        if ($data['visibility'] === 'private') {
            abort_unless($assignment->type === 'assignment', 403);
            if ($user->role === UserRole::Student) {
                abort_if(isset($data['student_id']) && (int) $data['student_id'] !== $user->id, 403);
                $studentId = $user->id;
            } else {
                $studentId = (int) ($data['student_id'] ?? 0);
            }
            abort_unless($assignment->classroom->students()->whereKey($studentId)->exists(), 403);
        }
        $comment = new ClassroomComment(['body' => $body, 'student_id' => $studentId]);
        $comment->user()->associate($user);
        $assignment->comments()->save($comment);

        return back()->with('success', 'Comment posted.');
    }

    public function destroy(Request $request, ClassroomComment $comment): RedirectResponse
    {
        $assignment = $comment->assignment;
        Gate::authorize('view', $assignment);
        $user = $request->user();
        abort_unless($comment->user_id === $user->id || Gate::allows('manage', $assignment->classroom), 403);
        // A student may never operate on another student's private thread.
        abort_if($comment->student_id !== null && $user->role === UserRole::Student && $comment->student_id !== $user->id, 403);
        $comment->delete();

        return back()->with('success', 'Comment deleted.');
    }
}
