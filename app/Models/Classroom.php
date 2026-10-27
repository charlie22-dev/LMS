<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Str;

class Classroom extends Model
{
    protected $fillable = ['name', 'section'];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Classroom $classroom): void {
            do {
                $code = Str::upper(Str::random(7));
            } while (static::query()->where('invite_code', $code)->exists());

            $classroom->invite_code = $code;
        });
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function submissions(): HasManyThrough
    {
        return $this->hasManyThrough(Submission::class, Assignment::class);
    }
}
