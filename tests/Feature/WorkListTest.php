<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Actions\CreateAssignment;
use App\Actions\CreateClassroom;
use App\Enums\UserRole;
use App\Events\ClassroomStreamUpdated;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WorkListTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_sees_only_enrolled_assignments_and_todo_excludes_turned_in_work(): void
    {
        $this->withoutVite();
        Event::fake([ClassroomStreamUpdated::class]);
        $teacher = User::factory()->create(['role' => UserRole::Teacher]);
        $student = User::factory()->create();
        $classroom = app(CreateClassroom::class)->handle($teacher, 'Visible class');
        $other = app(CreateClassroom::class)->handle($teacher, 'Private class');
        $classroom->students()->attach($student);
        $create = app(CreateAssignment::class);
        $pending = $create->handle($teacher, $classroom, 'Pending', null, 100, '2026-11-02T00:00:00Z');
        $completed = $create->handle($teacher, $classroom, 'Completed', null, 100, '2026-11-03T00:00:00Z');
        $create->handle($teacher, $other, 'Private', null, 100, '2026-11-04T00:00:00Z');
        DB::table('submissions')->insert(['assignment_id' => $completed->id, 'user_id' => $student->id, 'status' => 'submitted', 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($student)->get(route('todo'))->assertInertia(fn (Assert $page) => $page->component('Work/Index')->has('items.data', 1)->where('items.data.0.id', $pending->id));
        $this->get(route('calendar'))->assertInertia(fn (Assert $page) => $page->component('Work/Index')->has('items.data', 2)->where('items.data.0.id', $pending->id));
    }
}
