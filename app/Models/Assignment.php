<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assignment extends Model
{
    protected $attributes = ['points' => 100, 'type' => 'assignment'];

    protected $fillable = ['title', 'instructions', 'points', 'due_at', 'type'];

    protected function casts(): array
    {
        return ['points' => 'integer', 'due_at' => 'immutable_datetime', 'class_average' => 'decimal:2'];
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ClassroomComment::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ClassroomAttachment::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }
}
