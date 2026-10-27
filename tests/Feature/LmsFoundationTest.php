<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Actions\CreateClassroom;
use App\Actions\EnrollStudent;
use App\Actions\UploadSubmissionFile;
use App\Enums\SubmissionStatus;
use App\Enums\UserRole;
use App\Events\ClassroomStreamUpdated;
use App\Models\Assignment;
use App\Models\Classroom;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class LmsFoundationTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    private User $student;

    private Classroom $classroom;

    private Assignment $assignment;

    private Submission $submission;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake([ClassroomStreamUpdated::class]);
        $this->teacher = User::factory()->create(['role' => UserRole::Teacher]);
        $this->student = User::factory()->create();
        $this->classroom = app(CreateClassroom::class)->handle($this->teacher, 'Software Architecture', 'Section A');
        app(EnrollStudent::class)->handle($this->student, $this->classroom->invite_code);
        $this->assignment = new Assignment(['title' => 'Design a classroom', 'points' => 100]);
        $this->assignment->author()->associate($this->teacher);
        $this->classroom->assignments()->save($this->assignment);
        $this->submission = new Submission;
        $this->submission->user()->associate($this->student);
        $this->submission->status = SubmissionStatus::Draft;
        $this->assignment->submissions()->save($this->submission);
    }

    public function test_invite_is_generated_in_the_required_format(): void
    {
        $other = app(CreateClassroom::class)->handle($this->teacher, 'Databases');
        $this->assertMatchesRegularExpression('/\A[A-Z0-9]{7}\z/', $this->classroom->invite_code);
        $this->assertNotSame($this->classroom->invite_code, $other->invite_code);
    }

    public function test_repeated_joins_are_idempotent_and_case_insensitive(): void
    {
        app(EnrollStudent::class)->handle($this->student, ' '.strtolower($this->classroom->invite_code).' ');
        $this->assertDatabaseCount('classroom_user', 1);
    }

    public function test_database_enforces_membership_uniqueness(): void
    {
        $this->expectException(UniqueConstraintViolationException::class);
        DB::table('classroom_user')->insert(['classroom_id' => $this->classroom->id, 'user_id' => $this->student->id]);
    }

    public function test_unknown_invite_returns_a_validation_error(): void
    {
        $this->expectException(ValidationException::class);
        app(EnrollStudent::class)->handle($this->student, 'INVALID');
    }

    public function test_non_students_cannot_enroll(): void
    {
        $this->expectException(HttpException::class);
        app(EnrollStudent::class)->handle($this->teacher, $this->classroom->invite_code);
    }

    public function test_only_owner_can_update_or_upload_a_draft(): void
    {
        $stranger = User::factory()->create();
        $this->assertTrue(Gate::forUser($this->student)->allows('update', $this->submission));
        $this->assertTrue(Gate::forUser($this->student)->allows('upload', $this->submission));
        $this->assertFalse(Gate::forUser($stranger)->allows('upload', $this->submission));
        $this->assertFalse(Gate::forUser($this->teacher)->allows('upload', $this->submission));
    }

    public function test_every_non_draft_status_is_locked_including_returned(): void
    {
        foreach ([SubmissionStatus::Submitted, SubmissionStatus::Graded, SubmissionStatus::Returned] as $status) {
            $this->submission->status = $status;
            $this->assertFalse(Gate::forUser($this->student)->allows('update', $this->submission));
            $this->assertFalse(Gate::forUser($this->student)->allows('upload', $this->submission));
        }
    }

    public function test_removed_student_cannot_modify_a_draft(): void
    {
        $this->classroom->students()->detach($this->student);
        $this->assertFalse(Gate::forUser($this->student)->allows('update', $this->submission));
    }

    public function test_classroom_visibility_requires_membership_or_authority(): void
    {
        $this->assertTrue(Gate::forUser($this->teacher)->allows('view', $this->classroom));
        $this->assertTrue(Gate::forUser($this->student)->allows('view', $this->classroom));
        $this->assertFalse(Gate::forUser(User::factory()->create())->allows('view', $this->classroom));
        $this->assertTrue(Gate::forUser(User::factory()->create(['role' => UserRole::Admin]))->allows('view', $this->classroom));
    }

    public function test_relationships_link_authors_teachers_students_and_submissions(): void
    {
        $this->assertTrue($this->assignment->author->is($this->teacher));
        $this->assertTrue($this->assignment->classroom->is($this->classroom));
        $this->assertSame(1, $this->teacher->teachingAssignments()->count());
        $this->assertSame(1, $this->classroom->submissions()->count());
        $this->assertSame(1, $this->student->classrooms()->count());
        $this->assertTrue($this->submission->user->is($this->student));
    }

    public function test_classroom_deletion_cascades_without_deleting_users(): void
    {
        $this->classroom->delete();
        $this->assertDatabaseCount('classroom_user', 0);
        $this->assertDatabaseCount('assignments', 0);
        $this->assertDatabaseCount('submissions', 0);
        $this->assertDatabaseCount('users', 2);
    }

    public function test_duplicate_submission_is_rejected(): void
    {
        $this->expectException(UniqueConstraintViolationException::class);
        DB::table('submissions')->insert(['assignment_id' => $this->assignment->id, 'user_id' => $this->student->id]);
    }

    public function test_upload_stores_a_private_file_and_preserves_state(): void
    {
        Storage::fake('local');
        $saved = app(UploadSubmissionFile::class)->handle($this->student, $this->submission, UploadedFile::fake()->create('answer.pdf', 10, 'application/pdf'));
        Storage::disk('local')->assertExists($saved->file_url);
        $this->assertSame('answer.pdf', $saved->file_name);
        $this->assertSame(SubmissionStatus::Draft, $saved->status);
    }

    public function test_upload_rechecks_database_state_instead_of_trusting_a_stale_model(): void
    {
        Storage::fake('local');
        DB::table('submissions')->where('id', $this->submission->id)->update(['status' => 'submitted']);
        try {
            app(UploadSubmissionFile::class)->handle($this->student, $this->submission, UploadedFile::fake()->create('answer.pdf', 10));
            $this->fail('A stale draft must not overwrite a submitted submission.');
        } catch (AuthorizationException) {
            $this->assertSame([], Storage::disk('local')->allFiles());
            $this->assertNull($this->submission->fresh()->file_url);
        }
    }

    public function test_assignment_changes_dispatch_stream_notifications(): void
    {
        Event::assertDispatched(ClassroomStreamUpdated::class, fn (ClassroomStreamUpdated $event): bool => $event->classroomId === $this->classroom->id);
    }
}
