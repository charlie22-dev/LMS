<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Classroom;
use Illuminate\Foundation\Http\FormRequest;

class StoreAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $classroom = $this->route('classroom');

        return $classroom instanceof Classroom && ($this->user()?->can('manage', $classroom) ?? false);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
            'instructions' => ['nullable', 'string', 'max:20000'],
            'points' => ['required', 'integer', 'min:0', 'max:65535'],
            'due_at' => ['nullable', 'date'],
        ];
    }
}
