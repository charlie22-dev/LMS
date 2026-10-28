<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Submission;
use Illuminate\Foundation\Http\FormRequest;

class GradeSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $submission = $this->route('submission');

        return $submission instanceof Submission && ($this->user()?->can('grade', $submission) ?? false);
    }

    public function rules(): array
    {
        return [
            'grade' => ['required', 'numeric', 'decimal:0,2', 'min:0', 'max:65535'],
            'feedback' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
