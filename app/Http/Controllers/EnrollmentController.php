<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\EnrollStudent;
use App\Http\Requests\JoinClassroomRequest;
use Illuminate\Http\RedirectResponse;

class EnrollmentController extends Controller
{
    public function join(JoinClassroomRequest $request, EnrollStudent $enroll): RedirectResponse
    {
        $classroom = $enroll->handle($request->user(), $request->validated('invite_code'));

        return to_route('classrooms.stream', $classroom)->with('success', 'You are enrolled in this classroom.');
    }
}
