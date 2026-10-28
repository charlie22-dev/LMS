import type { Person } from '@/types/classroom';

export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'returned';

export interface Submission {
    id: number;
    status: SubmissionStatus;
    file_name: string | null;
    download_url: string | null;
    submitted_at: string | null;
    returned_at: string | null;
    grade: string | null;
    feedback: string | null;
    can_upload: boolean;
    can_grade: boolean;
    can_return: boolean;
}

export interface ReviewedSubmission extends Submission { student: Person }

export const statusLabels: Record<SubmissionStatus, string> = {
    draft: 'Draft', submitted: 'Turned in', graded: 'Graded · not returned', returned: 'Returned',
};
