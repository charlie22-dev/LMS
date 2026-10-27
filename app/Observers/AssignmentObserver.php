<?php

declare(strict_types=1);

namespace App\Observers;

use App\Events\ClassroomStreamUpdated;
use App\Models\Assignment;

class AssignmentObserver
{
    public function saved(Assignment $assignment): void
    {
        ClassroomStreamUpdated::dispatch($assignment->classroom_id);
    }

    public function deleted(Assignment $assignment): void
    {
        ClassroomStreamUpdated::dispatch($assignment->classroom_id);
    }
}
