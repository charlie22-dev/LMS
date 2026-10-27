<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classrooms', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 160);
            $table->string('section', 100)->nullable();
            $table->string('invite_code', 7)->unique();
            $table->foreignId('teacher_id')->constrained('users')->restrictOnDelete();
            $table->timestampsTz();
            $table->index(['teacher_id', 'id']);
        });

        Schema::create('classroom_user', function (Blueprint $table): void {
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestampsTz();
            $table->primary(['classroom_id', 'user_id']);
            $table->index(['user_id', 'classroom_id']);
        });

        Schema::create('assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->string('title', 200);
            $table->text('instructions')->nullable();
            $table->unsignedInteger('points')->default(100);
            $table->timestampTz('due_at')->nullable();
            $table->decimal('class_average', 7, 2)->nullable();
            $table->timestampsTz();
            $table->index(['classroom_id', 'id']);
            $table->index(['classroom_id', 'due_at']);
            $table->index('author_id');
        });

        Schema::create('submissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['draft', 'submitted', 'graded', 'returned'])->default('draft');
            // Private storage object key, never a publicly accessible student file URL.
            $table->string('file_url', 2048)->nullable();
            $table->string('file_name')->nullable();
            $table->decimal('grade', 7, 2)->nullable();
            $table->timestampTz('graded_at')->nullable();
            $table->timestampsTz();
            $table->unique(['assignment_id', 'user_id']);
            $table->index(['user_id', 'status']);
            $table->index(['assignment_id', 'status']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE classrooms ADD CONSTRAINT classrooms_invite_format CHECK (invite_code ~ '^[A-Z0-9]{7}$')");
            DB::statement('ALTER TABLE assignments ADD CONSTRAINT assignments_points_range CHECK (points BETWEEN 0 AND 65535), ADD CONSTRAINT assignments_average_range CHECK (class_average >= 0 AND class_average <= points)');
            DB::statement("ALTER TABLE submissions ADD CONSTRAINT submissions_grade_nonnegative CHECK (grade >= 0), ADD CONSTRAINT submissions_graded_fields CHECK (status <> 'graded' OR (grade IS NOT NULL AND graded_at IS NOT NULL)), ADD CONSTRAINT submissions_file_pair CHECK ((file_url IS NULL) = (file_name IS NULL))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('classroom_user');
        Schema::dropIfExists('classrooms');
    }
};
