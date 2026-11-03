<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Actions\CreateAssignment;
use App\Actions\CreateClassroom;
use App\Enums\UserRole;
use App\Models\ClassroomComment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClassroomCommentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_class_comments_are_shared_and_private_threads_are_isolated(): void
    {
        $this->withoutVite();
        $teacher = User::factory()->create(['role' => UserRole::Teacher]);
        $alice = User::factory()->create(['role' => UserRole::Student]);
        $bob = User::factory()->create(['role' => UserRole::Student]);
        $outsider = User::factory()->create(['role' => UserRole::Student]);
        $classroom = app(CreateClassroom::class)->handle($teacher, 'Discussion');
        $classroom->students()->attach([$alice->id, $bob->id]);
        $assignment = app(CreateAssignment::class)->handle($teacher, $classroom, 'Discussion assignment', null, 100, null);
        $url = route('comments.store', $assignment);
        $this->actingAs($alice)->post($url, ['visibility' => 'class', 'body' => 'A shared question'])->assertSessionHasNoErrors()->assertRedirect();
        $this->post($url, ['visibility' => 'private', 'body' => 'Alice private question'])->assertSessionHasNoErrors()->assertRedirect();
        $aliceComment = ClassroomComment::query()->where('body', 'Alice private question')->firstOrFail();
        $this->actingAs($teacher)->post($url, ['visibility' => 'private', 'student_id' => $alice->id, 'body' => 'Teacher private reply'])->assertSessionHasNoErrors()->assertRedirect();
        $this->actingAs($bob)->get(route('assignments.show', $assignment).'?student='.$alice->id)
            ->assertInertia(fn (Assert $page) => $page->has('classComments.data', 1)->has('privateComments.data', 0)
                ->where('commentSettings.student_id', $bob->id)->has('commentSettings.students', 0));
        $this->post($url, ['visibility' => 'private', 'student_id' => $alice->id, 'body' => 'Forged thread'])->assertForbidden();
        $this->delete(route('comments.destroy', $aliceComment))->assertForbidden();
        $this->actingAs($alice)->get(route('assignments.show', $assignment))->assertInertia(fn (Assert $page) => $page
            ->has('privateComments.data', 2)->where('privateComments.data.0.body', 'Teacher private reply'));
        $this->actingAs($teacher)->get(route('assignments.show', $assignment).'?student='.$alice->id)->assertInertia(fn (Assert $page) => $page->has('privateComments.data', 2));
        $this->post($url, ['visibility' => 'private', 'student_id' => $outsider->id, 'body' => 'Not enrolled'])->assertForbidden();
        $this->actingAs($outsider)->post($url, ['visibility' => 'class', 'body' => 'Not enrolled'])->assertForbidden();
        $this->get(route('assignments.show', $assignment))->assertForbidden();
        $this->actingAs($alice)->post($url, ['visibility' => 'class', 'body' => '   '])->assertSessionHasErrors('body');
        $this->actingAs($teacher)->delete(route('comments.destroy', $aliceComment))->assertRedirect();
        $this->assertDatabaseMissing('classroom_comments', ['id' => $aliceComment->id]);
    }

    public function test_materials_accept_class_comments_but_not_private_threads(): void
    {
        $teacher = User::factory()->create(['role' => UserRole::Teacher]);
        $student = User::factory()->create(['role' => UserRole::Student]);
        $classroom = app(CreateClassroom::class)->handle($teacher, 'Materials');
        $classroom->students()->attach($student);
        $post = app(CreateAssignment::class)->handle($teacher, $classroom, 'Reading', null, 0, null, 'material');
        $this->actingAs($student)->post(route('comments.store', $post), ['visibility' => 'class', 'body' => 'Thank you'])->assertRedirect();
        $this->post(route('comments.store', $post), ['visibility' => 'private', 'body' => 'Private'])->assertForbidden();
    }
}
