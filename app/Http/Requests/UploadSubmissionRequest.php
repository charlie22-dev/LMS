<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Submission;
use Illuminate\Foundation\Http\FormRequest;

class UploadSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $submission = $this->route('submission');

        return $submission instanceof Submission && ($this->user()?->can('upload', $submission) ?? false);
    }

    public function rules(): array
    {
        return ['file' => ['required', 'file', 'mimes:pdf,txt,doc,docx,ppt,pptx,jpg,jpeg,png,zip', 'max:20480']];
    }
}
