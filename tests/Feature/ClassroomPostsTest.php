<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Actions\CreateAssignment;
use App\Actions\CreateClassroom;
use App\Enums\UserRole;
use App\Models\Assignment;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClassroomPostsTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_post_all_types_with_private_attachments(): void
    {
        $this->withoutVite();
        Storage::fake('local');
        $teacher = User::factory()->create(['role' => UserRole::Teacher]);
        $classroom = app(CreateClassroom::class)->handle($teacher, 'Resources');
        $student = User::factory()->create(['role' => UserRole::Student]);
        $classroom->students()->attach($student);
        foreach (['assignment', 'material', 'announcement'] as $type) {
            $this->actingAs($teacher)->post(route('assignments.store', $classroom), [
                'title' => 'Class '.$type, 'type' => $type, 'points' => 100,
                'files' => [UploadedFile::fake()->createWithContent('notes.txt', 'Class notes')],
            ])->assertSessionHasNoErrors()->assertRedirect();
            $post = Assignment::query()->latest('id')->firstOrFail();
            $attachment = $post->attachments()->firstOrFail();
            Storage::disk('local')->assertExists($attachment->path);
            $this->actingAs($student)->get(route('classroom-attachments.download', $attachment))->assertOk()->assertDownload('notes.txt');
            $this->get(route('classroom-attachments.download', $attachment).'?preview=1')->assertOk()
                ->assertHeader('content-type', 'text/plain; charset=utf-8')
                ->assertHeader('content-disposition', 'inline; filename=notes.txt')
                ->assertStreamedContent('Class notes');
            $this->get(route('assignments.show', $post))->assertInertia(fn (Assert $page) => $page
                ->where('assignment.type', $type)->has('assignment.attachments', 1)
                ->where('permissions.submit', $type === 'assignment')
                ->where('permissions.review', false));
            if ($type !== 'assignment') {
                $this->post(route('submissions.draft', $post))->assertForbidden();
            }
            $outsider = User::factory()->create();
            $this->actingAs($outsider)->get(route('classroom-attachments.download', $attachment).'?preview=1')->assertForbidden();
        }
        $this->actingAs($student)->get('/todo')->assertInertia(fn (Assert $page) => $page->has('items.data', 1));
        $this->actingAs($student)->post(route('assignments.store', $classroom), [
            'title' => 'Unauthorized material', 'type' => 'material', 'points' => 0,
        ])->assertForbidden();
    }

    public function test_student_can_upload_directly_and_cannot_replace_turned_in_work(): void
    {
        Storage::fake('local');
        $teacher = User::factory()->create(['role' => UserRole::Teacher]);
        $student = User::factory()->create(['role' => UserRole::Student]);
        $classroom = app(CreateClassroom::class)->handle($teacher, 'Work');
        $classroom->students()->attach($student);
        $assignment = app(CreateAssignment::class)->handle($teacher, $classroom, 'Homework', null, 100, null);
        $this->actingAs($student)->post(route('submissions.start-file', $assignment), [
            'file' => UploadedFile::fake()->createWithContent('answer.txt', 'My answer'),
        ])->assertSessionHasNoErrors()->assertRedirect(route('assignments.show', $assignment));
        $submission = Submission::query()->firstOrFail();
        Storage::disk('local')->assertExists($submission->file_url);
        $this->assertSame('answer.txt', $submission->file_name);
        $this->get(route('submissions.download', $submission).'?preview=1')->assertOk()
            ->assertHeader('content-disposition', 'inline; filename=answer.txt')->assertStreamedContent('My answer');
        $this->post(route('submissions.submit', $submission))->assertRedirect();
        $this->post(route('submissions.start-file', $assignment), [
            'file' => UploadedFile::fake()->createWithContent('replacement.txt', 'Changed answer'),
        ])->assertForbidden();
        $this->assertSame('answer.txt', $submission->fresh()->file_name);
    }
}
