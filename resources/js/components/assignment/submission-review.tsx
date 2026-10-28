import { useForm } from '@inertiajs/react';
import { Download } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input, Textarea } from '@/components/ui/input';
import { statusLabels, type ReviewedSubmission } from '@/types/submission';

export function SubmissionReview({ submission, points, dueAt }: { submission: ReviewedSubmission; points: number; dueAt: string | null }) {
    const grade = useForm({ grade: submission.grade ?? '', feedback: submission.feedback ?? '' });
    const release = useForm({});
    const late = !!dueAt && !!submission.submitted_at && new Date(submission.submitted_at) > new Date(dueAt);

    function save(event: FormEvent) {
        event.preventDefault();
        grade.patch(`/submissions/${submission.id}/grade`, { preserveScroll: true });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{submission.student.name}</h3><span className="rounded-md bg-muted px-2 py-1 text-xs">{statusLabels[submission.status]}</span></div>
                {submission.submitted_at && <p className="mt-2 text-xs text-muted-foreground">Turned in {new Date(submission.submitted_at).toLocaleString()}{late ? ' · Late' : ''}</p>}
            </CardHeader>
            <CardContent className="space-y-5">
                {submission.download_url && <a href={submission.download_url} className="inline-flex min-h-10 max-w-full items-center gap-2 rounded text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"><Download className="size-4 shrink-0" aria-hidden="true" /><span className="break-all">{submission.file_name}</span></a>}
                {submission.can_grade ? (
                    <form onSubmit={save} className="space-y-4">
                        <FormField id={`grade-${submission.id}`} label={`Grade (out of ${points})`} error={grade.errors.grade}>
                            <Input id={`grade-${submission.id}`} type="number" required min={0} max={points} step="0.01" value={grade.data.grade} onChange={(e) => grade.setData('grade', e.target.value)} aria-invalid={!!grade.errors.grade} aria-describedby={grade.errors.grade ? `grade-${submission.id}-error` : undefined} className="max-w-40" />
                        </FormField>
                        <FormField id={`feedback-${submission.id}`} label="Feedback (optional)" error={grade.errors.feedback}>
                            <Textarea id={`feedback-${submission.id}`} maxLength={5000} value={grade.data.feedback} onChange={(e) => grade.setData('feedback', e.target.value)} aria-invalid={!!grade.errors.feedback} aria-describedby={grade.errors.feedback ? `feedback-${submission.id}-error` : undefined} />
                        </FormField>
                        <Button variant="outline" disabled={grade.processing || release.processing}>{grade.processing ? 'Saving…' : 'Save grade'}</Button>
                    </form>
                ) : <div><p className="font-medium tabular-nums">{submission.grade} / {points}</p>{submission.feedback && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{submission.feedback}</p>}</div>}
                {submission.can_return && <div className="space-y-3 border-t pt-4"><p className="text-xs leading-5 text-muted-foreground">Return the saved grade and feedback to make them visible to the student.</p><Button disabled={release.processing || grade.processing || grade.isDirty} onClick={() => release.post(`/submissions/${submission.id}/return`, { preserveScroll: true })}>{release.processing ? 'Returning…' : 'Return grade'}</Button>{grade.isDirty && <p className="text-xs text-muted-foreground">Save your changes before returning this grade.</p>}</div>}
            </CardContent>
        </Card>
    );
}
