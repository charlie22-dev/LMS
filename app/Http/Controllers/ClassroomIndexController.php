<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Classroom;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassroomIndexController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $classrooms = Classroom::query()
            ->when($user->role === UserRole::Teacher, fn (Builder $query) => $query->where('teacher_id', $user->id))
            ->when($user->role === UserRole::Student, fn (Builder $query) => $query->whereHas('students', fn (Builder $students) => $students->whereKey($user->id)))
            ->select(['id', 'name', 'section', 'teacher_id'])
            ->with('teacher:id,name')->orderByDesc('id')->cursorPaginate(12);

        return Inertia::render('Classroom/Index', ['classrooms' => $classrooms]);
    }
}
