<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Teacher = 'teacher';
    case Student = 'student';
    case Admin = 'admin';
}
