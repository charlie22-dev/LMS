<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class JoinClassroomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Student;
    }

    protected function prepareForValidation(): void
    {
        $code = $this->input('invite_code');
        if (is_string($code)) {
            $this->merge(['invite_code' => strtoupper(trim($code))]);
        }
    }

    public function rules(): array
    {
        return ['invite_code' => ['required', 'string', 'regex:/\A[A-Z0-9]{7}\z/']];
    }
}
