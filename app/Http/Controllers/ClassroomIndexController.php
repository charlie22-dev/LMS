<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Classroom;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClassroomIndexController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $input = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', Rule::in(['recent', 'name'])],
        ]);
        $search = trim($input['search'] ?? '');
        $sort = $input['sort'] ?? 'recent';
        $classrooms = Classroom::query()
            ->when($user->role === UserRole::Teacher, fn (Builder $query) => $query->where('teacher_id', $user->id))
            ->when($user->role === UserRole::Student, fn (Builder $query) => $query->whereHas('students', fn (Builder $students) => $students->whereKey($user->id)))
            ->select(['id', 'name', 'section', 'teacher_id'])
            ->with('teacher:id,name')->withCount(['students', 'assignments'])
            ->when($search !== '', fn (Builder $query) => $query->where(function (Builder $query) use ($search): void {
                $term = '%'.mb_strtolower($search).'%';
                $query->whereRaw('LOWER(name) LIKE ?', [$term])->orWhereRaw('LOWER(section) LIKE ?', [$term]);
            }))
            ->when($sort === 'name', fn (Builder $query) => $query->orderBy('name')->orderBy('id'), fn (Builder $query) => $query->orderByDesc('id'))
            ->cursorPaginate(12)->withQueryString();

        return Inertia::render('Classroom/Index', ['classrooms' => $classrooms, 'filters' => ['search' => $search, 'sort' => $sort]]);
    }
}
