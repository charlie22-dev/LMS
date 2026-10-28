<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\CreateClassroom;
use App\Http\Requests\StoreClassroomRequest;
use Illuminate\Http\RedirectResponse;

class ClassroomController extends Controller
{
    public function store(StoreClassroomRequest $request, CreateClassroom $create): RedirectResponse
    {
        $classroom = $create->handle($request->user(), $request->validated('name'), $request->validated('section'));

        return to_route('classrooms.stream', $classroom)->with('success', 'Your classroom is ready. Share the class code to invite students.');
    }
}
