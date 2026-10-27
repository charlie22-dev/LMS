<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

class ClassroomStreamUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public readonly int $classroomId) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('classrooms.'.$this->classroomId)];
    }

    public function broadcastAs(): string
    {
        return 'stream.updated';
    }

    public function broadcastWith(): array
    {
        return ['classroom_id' => $this->classroomId];
    }
}
