<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Actions\CreateClassroom;
use App\Enums\UserRole;
use App\Events\ClassroomStreamUpdated;
use App\Models\Assignment;
use App\Models\Classroom;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LmsHttpTest extends TestCase
{
    use RefreshDatabase;

    private Classroom $classroom;

    private User $student;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Event::fake([ClassroomStreamUpdated::class]);
        $teacher = User::factory()->create(['role' => UserRole::Teacher]);
        $this->classroom = app(CreateClassroom::class)->handle($teacher, 'Architecture');
        $this->student = User::factory()->create();
        $this->classroom->students()->attach($this->student);
        $assignment = new Assignment(['title' => 'Relations and indexes']);
        $assignment->author()->associate($teacher);
        $this->classroom->assignments()->save($assignment);
    }

    public function test_login_page_renders_through_inertia_middleware(): void
    {
        $this->get(route('login'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Auth/Login'));
    }

    public function test_stream_passes_author_and_classroom_props_without_exposing_invite(): void
    {
        $this->actingAs($this->student)->get(route('classrooms.stream', $this->classroom))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Classroom/Stream')
            ->where('classroom.name', 'Architecture')->where('classroom.invite_code', null)
            ->has('streamItems.data', 1)->where('streamItems.data.0.author.id', $this->classroom->teacher_id));
    }

    public function test_outsiders_cannot_read_a_stream(): void
    {
        $this->actingAs(User::factory()->create())->get(route('classrooms.stream', $this->classroom))->assertForbidden();
    }

    public function test_guests_are_redirected_to_sign_in(): void
    {
        $this->get(route('classrooms.stream', $this->classroom))->assertRedirect(route('login'));
    }

    public function test_join_rejects_malformed_codes_and_repeated_joins_do_not_duplicate(): void
    {
        $this->actingAs($this->student)->post(route('classrooms.join'), ['invite_code' => '<script>'])->assertSessionHasErrors('invite_code');
        foreach (range(1, 2) as $attempt) {
            $this->post(route('classrooms.join'), ['invite_code' => strtolower($this->classroom->invite_code)])->assertRedirect(route('classrooms.stream', $this->classroom));
        }
        $this->assertDatabaseCount('classroom_user', 1);
    }
}
