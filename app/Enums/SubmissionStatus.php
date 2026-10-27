<?php

declare(strict_types=1);

namespace App\Enums;

enum SubmissionStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case Graded = 'graded';
    case Returned = 'returned';
}
