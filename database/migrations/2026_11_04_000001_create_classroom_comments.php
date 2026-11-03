<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classroom_comments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Null means a class comment; otherwise this is the student's private thread.
            $table->foreignId('student_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestampsTz();
            $table->index(['assignment_id', 'student_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classroom_comments');
    }
};
