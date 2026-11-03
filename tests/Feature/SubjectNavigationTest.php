<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Actions\CreateAssignment;
use App\Actions\CreateClassroom;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SubjectNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_navigation_shows_only_enrolled_subjects_and_filters_their_work(): void
    {
        $this->withoutVite();
        $teacher = User::factory()->create(['role' => UserRole::Teacher]);
        $student = User::factory()->create(['role' => UserRole::Student]);
        $first = app(CreateClassroom::class)->handle($teacher, 'Algebra', 'Section A');
        $second = app(CreateClassroom::class)->handle($teacher, 'Biology', 'Section B');
        $private = app(CreateClassroom::class)->handle($teacher, 'Private class');
        $first->students()->attach($student);
        $second->students()->attach($student);
        app(CreateAssignment::class)->handle($teacher, $first, 'Algebra work', null, 100, null);
        app(CreateAssignment::class)->handle($teacher, $second, 'Biology work', null, 100, null);
        $this->actingAs($student)->get('/todo?classroom='.$first->id)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('navigationClassrooms', 2)->where('navigationClassrooms.0.name', 'Algebra')
            ->where('navigationClassrooms.0.section', 'Section A')
            ->has('items.data', 1)->where('items.data.0.title', 'Algebra work')
            ->where('selectedClassroom.id', $first->id));
        $this->get('/todo')->assertInertia(fn (Assert $page) => $page->has('items.data', 2)->where('selectedClassroom', null));
        $this->get('/todo?classroom='.$private->id)->assertForbidden();
        $this->get('/calendar?classroom='.$private->id)->assertForbidden();
        $outsider = User::factory()->create(['role' => UserRole::Student]);
        $this->actingAs($outsider)->get('/todo')->assertInertia(fn (Assert $page) => $page->has('navigationClassrooms', 0)->has('items.data', 0));
    }

    public function test_calendar_loads_the_entire_visible_month_and_validates_month_navigation(): void
    {
        $this->withoutVite();
        $teacher = User::factory()->create(['role' => UserRole::Teacher]);
        $student = User::factory()->create(['role' => UserRole::Student]);
        $classroom = app(CreateClassroom::class)->handle($teacher, 'Calendar subject');
        $classroom->students()->attach($student);
        foreach (range(1, 35) as $number) {
            app(CreateAssignment::class)->handle($teacher, $classroom, 'Due work '.$number, null, 100, '2026-11-10T12:00:00Z');
        }
        app(CreateAssignment::class)->handle($teacher, $classroom, 'Outside visible grid', null, 100, '2026-12-25T12:00:00Z');
        $this->actingAs($student)->get('/calendar?month=2026-11&classroom='.$classroom->id)->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('calendarMonth', '2026-11')->has('items.data', 35)
                ->where('items.next_page_url', null)->where('selectedClassroom.id', $classroom->id));
        $this->get('/calendar?month=2026-12&classroom='.$classroom->id)->assertInertia(fn (Assert $page) => $page
            ->where('calendarMonth', '2026-12')->has('items.data', 1)->where('items.data.0.title', 'Outside visible grid'));
        $this->getJson('/calendar?month=2026-13')->assertUnprocessable()->assertJsonValidationErrors('month');
    }
}
