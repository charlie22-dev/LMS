<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Actions\CreateAssignment;
use App\Actions\CreateClassroom;
use App\Actions\GradeSubmission;
use App\Actions\ReturnSubmissionGrade;
use App\Actions\StartSubmission;
use App\Actions\TurnInSubmission;
use App\Actions\UploadSubmissionFile;
use App\Enums\SubmissionStatus;
use App\Enums\UserRole;
use App\Events\ClassroomStreamUpdated;
use App\Models\Assignment;
use App\Models\Classroom;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AssignmentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    private User $student;

    private Classroom $classroom;

    private Assignment $assignment;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Event::fake([ClassroomStreamUpdated::class]);
        Storage::fake('local');
        $this->teacher = User::factory()->create(['role' => UserRole::Teacher]);
        $this->student = User::factory()->create();
        $this->classroom = app(CreateClassroom::class)->handle($this->teacher, 'Architecture');
        $this->classroom->students()->attach($this->student);
        $this->assignment = app(CreateAssignment::class)->handle(
            $this->teacher, $this->classroom, 'Design a workflow', 'Explain your locking strategy.', 100, null,
        );
    }

    public function test_teachers_create_classrooms_without_accepting_forged_ownership(): void
    {
        $this->actingAs($this->teacher)->post(route('classrooms.store'), [
            'name' => 'Databases', 'section' => 'A', 'teacher_id' => $this->student->id,
        ])->assertRedirect();
        $this->assertDatabaseHas('classrooms', ['name' => 'Databases', 'teacher_id' => $this->teacher->id]);
        $this->actingAs($this->student)->post(route('classrooms.store'), ['name' => 'Forbidden'])->assertForbidden();
    }

    public function test_posting_assignments_sets_the_real_author_and_normalizes_time(): void
    {
        $this->actingAs($this->teacher)->post(route('assignments.store', $this->classroom), [
            'title' => 'Transactions', 'points' => 50, 'due_at' => '2026-11-01T20:00:00+08:00',
            'author_id' => $this->student->id, 'classroom_id' => 999,
        ])->assertRedirect();
        $assignment = Assignment::query()->where('title', 'Transactions')->firstOrFail();
        $this->assertSame($this->teacher->id, $assignment->author_id);
        $this->assertSame($this->classroom->id, $assignment->classroom_id);
        $this->assertSame('2026-11-01 12:00', $assignment->due_at->utc()->format('Y-m-d H:i'));
    }

    public function test_non_owners_cannot_post_assignments_and_invalid_points_are_rejected(): void
    {
        $payload = ['title' => 'Other work', 'points' => 100];
        $this->actingAs(User::factory()->create(['role' => UserRole::Teacher]))
            ->post(route('assignments.store', $this->classroom), $payload)->assertForbidden();
        $this->actingAs($this->student)->post(route('assignments.store', $this->classroom), $payload)->assertForbidden();
        $this->actingAs($this->teacher)->post(route('assignments.store', $this->classroom), [
            'title' => 'Invalid', 'points' => -1,
        ])->assertSessionHasErrors('points');
    }

    public function test_reading_an_assignment_does_not_create_a_draft(): void
    {
        $this->actingAs($this->student)->get(route('assignments.show', $this->assignment))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Assignment/Show')
            ->where('permissions.submit', true)->where('permissions.review', false)
            ->where('submission', null)->where('submissions', null));
        $this->assertDatabaseCount('submissions', 0);
        $this->actingAs(User::factory()->create())->get(route('assignments.show', $this->assignment))->assertForbidden();
    }

    public function test_starting_a_draft_is_idempotent_and_never_reopens_submitted_work(): void
    {
        $url = route('submissions.draft', $this->assignment);
        $this->actingAs($this->student)->post($url)->assertRedirect(route('assignments.show', $this->assignment));
        $this->post($url)->assertRedirect();
        $this->assertDatabaseCount('submissions', 1);
        $submission = $this->turnIn();
        $this->post($url)->assertRedirect();
        $this->assertSame(SubmissionStatus::Submitted, $submission->fresh()->status);
        $this->assertDatabaseCount('submissions', 1);
    }

    public function test_student_uploads_a_file_turns_it_in_and_cannot_replace_it(): void
    {
        $draft = app(StartSubmission::class)->handle($this->student, $this->assignment);
        $this->actingAs($this->student)->post(route('submissions.file', $draft), [
            'file' => UploadedFile::fake()->createWithContent('answer.txt', 'This is my answer.'),
        ])->assertRedirect();
        $this->post(route('submissions.submit', $draft))->assertRedirect(route('assignments.show', $this->assignment));
        $saved = $draft->fresh();
        $this->assertSame(SubmissionStatus::Submitted, $saved->status);
        $this->assertNotNull($saved->submitted_at);
        Storage::disk('local')->assertExists($saved->file_url);
        $this->post(route('submissions.file', $draft), [
            'file' => UploadedFile::fake()->createWithContent('replacement.txt', 'Replacement.'),
        ])->assertForbidden();
        $this->post(route('submissions.submit', $draft))->assertForbidden();
        $this->assertSame($saved->file_url, $draft->fresh()->file_url);
    }

    public function test_turn_in_requires_a_file_and_rejects_a_missing_storage_object(): void
    {
        $draft = app(StartSubmission::class)->handle($this->student, $this->assignment);
        $this->actingAs($this->student)->post(route('submissions.submit', $draft))->assertSessionHasErrors('submission');
        $saved = $this->upload($this->student);
        Storage::disk('local')->delete($saved->file_url);
        $this->post(route('submissions.submit', $saved))->assertSessionHasErrors('submission');
        $this->assertSame(SubmissionStatus::Draft, $saved->fresh()->status);
    }

    public function test_drafts_are_private_and_file_downloads_require_current_authorization(): void
    {
        $draft = $this->upload($this->student);
        $this->actingAs($this->teacher)->get(route('submissions.download', $draft))->assertForbidden();
        $otherStudent = User::factory()->create();
        $this->classroom->students()->attach($otherStudent);
        $this->actingAs($otherStudent)->get(route('submissions.download', $draft))->assertForbidden();
        $this->post(route('submissions.submit', $draft))->assertForbidden();
        $this->actingAs($this->student)->get(route('submissions.download', $draft))
            ->assertOk()->assertDownload('answer.txt')->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->classroom->students()->detach($this->student);
        $this->get(route('submissions.download', $draft))->assertForbidden();
    }

    public function test_teacher_can_download_only_their_classroom_turned_in_files(): void
    {
        $submission = $this->turnIn();
        $this->actingAs($this->teacher)->get(route('submissions.download', $submission))->assertDownload('answer.txt');
        $this->actingAs(User::factory()->create(['role' => UserRole::Teacher]))
            ->get(route('submissions.download', $submission))->assertForbidden();
    }

    public function test_grades_and_feedback_are_hidden_until_returned_then_remain_locked(): void
    {
        $submission = $this->turnIn();
        $this->actingAs($this->teacher)->patch(route('submissions.grade', $submission), [
            'grade' => '87.50', 'feedback' => 'Clear explanation.',
        ])->assertRedirect();
        $this->assertSame($this->teacher->id, $submission->fresh()->graded_by);
        $this->actingAs($this->student)->get(route('assignments.show', $this->assignment))
            ->assertInertia(fn (Assert $page) => $page->where('submission.status', 'graded')
                ->where('submission.grade', null)->where('submission.feedback', null)
                ->where('assignment.class_average', null)->where('submissions', null));
        $this->actingAs($this->teacher)->post(route('submissions.return', $submission))->assertRedirect();
        $this->actingAs($this->student)->get(route('assignments.show', $this->assignment))
            ->assertInertia(fn (Assert $page) => $page->where('submission.status', 'returned')
                ->where('submission.grade', '87.50')->where('submission.feedback', 'Clear explanation.')
                ->where('submission.can_upload', false)->missing('submission.file_url'));
        $this->assertNotNull($submission->fresh()->returned_at);
        $this->post(route('submissions.file', $submission), [
            'file' => UploadedFile::fake()->createWithContent('answer.txt', 'Changed.'),
        ])->assertForbidden();
    }

    public function test_only_classroom_teacher_can_grade_and_return_work(): void
    {
        $submission = $this->turnIn();
        foreach ([$this->student, User::factory()->create(['role' => UserRole::Teacher])] as $outsider) {
            $this->actingAs($outsider)->patch(route('submissions.grade', $submission), ['grade' => 100])->assertForbidden();
            $this->post(route('submissions.return', $submission))->assertForbidden();
        }
        $this->actingAs($this->teacher)->post(route('submissions.return', $submission))->assertForbidden();
        $draft = $this->upload(User::factory()->create());
        $this->patch(route('submissions.grade', $draft), ['grade' => 100])->assertForbidden();
    }

    public function test_invalid_grades_leave_the_submission_and_average_unchanged(): void
    {
        $submission = $this->turnIn();
        $this->actingAs($this->teacher);
        foreach (['-1', '100.01', '10.123', 'not-a-grade'] as $grade) {
            $this->patch(route('submissions.grade', $submission), ['grade' => $grade])->assertSessionHasErrors('grade');
        }
        $this->assertNull($submission->fresh()->grade);
        $this->assertNull($this->assignment->fresh()->class_average);
        $this->assertSame(SubmissionStatus::Submitted, $submission->fresh()->status);
    }

    public function test_average_includes_returned_grades_and_regrading_replaces_previous_value(): void
    {
        $first = $this->turnIn();
        $second = $this->turnIn(User::factory()->create());
        app(GradeSubmission::class)->handle($this->teacher, $first, '100', null);
        app(ReturnSubmissionGrade::class)->handle($this->teacher, $first->fresh());
        app(GradeSubmission::class)->handle($this->teacher, $second, '0', null);
        $this->assertSame('50.00', $this->assignment->fresh()->class_average);
        app(GradeSubmission::class)->handle($this->teacher, $second->fresh(), '50', 'Rechecked.');
        $this->assertSame('75.00', $this->assignment->fresh()->class_average);
        $this->assertSame('100.00', $first->fresh()->grade);
    }

    public function test_grading_uses_current_state_even_with_a_stale_submission_object(): void
    {
        $submission = $this->turnIn();
        app(GradeSubmission::class)->handle($this->teacher, $submission, '60', null);
        app(ReturnSubmissionGrade::class)->handle($this->teacher, $submission->fresh());
        $this->expectException(AuthorizationException::class);
        app(GradeSubmission::class)->handle($this->teacher, $submission, '100', 'Stale update.');
    }

    public function test_late_work_is_accepted_and_has_an_actual_turn_in_time(): void
    {
        $this->assignment->due_at = now()->subDay();
        $this->assignment->saveQuietly();
        $submission = $this->turnIn();
        $this->assertTrue($submission->submitted_at->greaterThan($this->assignment->due_at));
    }

    public function test_teacher_review_is_paginated_and_excludes_private_drafts(): void
    {
        $this->upload($this->student);
        foreach (User::factory()->count(22)->create() as $student) {
            DB::table('submissions')->insert([
                'assignment_id' => $this->assignment->id, 'user_id' => $student->id,
                'status' => 'submitted', 'submitted_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        $this->actingAs($this->teacher)->get(route('assignments.show', $this->assignment))
            ->assertInertia(fn (Assert $page) => $page->has('submissions.data', 20)
                ->where('submissions.data.0.status', 'submitted')->where('permissions.review', true)
                ->where('submission', null)->where('submissions.next_page_url', fn ($url): bool => is_string($url)));
    }

    public function test_grading_does_not_broadcast_private_grade_activity_to_classroom(): void
    {
        $submission = $this->turnIn();
        Event::fake([ClassroomStreamUpdated::class]);
        app(GradeSubmission::class)->handle($this->teacher, $submission, '90', 'Private feedback.');
        Event::assertNotDispatched(ClassroomStreamUpdated::class);
    }

    private function upload(User $student): Submission
    {
        $this->classroom->students()->syncWithoutDetaching([$student->id]);
        $draft = app(StartSubmission::class)->handle($student, $this->assignment);

        return app(UploadSubmissionFile::class)->handle(
            $student, $draft, UploadedFile::fake()->createWithContent('answer.txt', 'This is my answer.'),
        );
    }

    private function turnIn(?User $student = null): Submission
    {
        $student ??= $this->student;

        return app(TurnInSubmission::class)->handle($student, $this->upload($student));
    }
}
