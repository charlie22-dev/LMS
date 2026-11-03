<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assignments', function (Blueprint $table): void {
            $table->enum('type', ['assignment', 'material', 'announcement'])->default('assignment');
            $table->index(['classroom_id', 'type', 'id']);
        });
        Schema::create('classroom_attachments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->string('path', 2048);
            $table->string('name');
            $table->unsignedBigInteger('size');
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classroom_attachments');
        Schema::table('assignments', function (Blueprint $table): void {
            $table->dropIndex(['classroom_id', 'type', 'id']);
            $table->dropColumn('type');
        });
    }
};
