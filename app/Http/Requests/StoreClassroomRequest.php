<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Classroom;
use Illuminate\Foundation\Http\FormRequest;

class StoreClassroomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Classroom::class) ?? false;
    }

    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:160'], 'section' => ['nullable', 'string', 'max:100']];
    }
}
