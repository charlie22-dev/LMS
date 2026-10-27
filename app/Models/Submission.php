<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SubmissionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    protected $attributes = ['status' => 'draft'];

    // Ownership, state, grades, and storage keys are assigned only by trusted actions.
    protected $guarded = ['*'];

    protected function casts(): array
    {
        return ['status' => SubmissionStatus::class, 'grade' => 'decimal:2', 'graded_at' => 'immutable_datetime'];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
