<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassroomAttachment extends Model
{
    protected $fillable = ['path', 'name', 'size'];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function toDownloadData(): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'size' => $this->size,
            'url' => route('classroom-attachments.download', $this)];
    }
}
