import { useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Download, LockKeyhole, Upload } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import type { Submission } from '@/types/submission';
import { statusLabels } from '@/types/submission';

export function StudentWork({ assignmentId, points, submission }: { assignmentId: number; points: number; submission: Submission | null }) {
    const start = useForm({});
    const turnIn = useForm({});
    const upload = useForm<{ file: File | null }>({ file: null });
    const [inputKey, setInputKey] = useState(0);
    const { errors } = usePage().props;

    function saveFile(event: FormEvent) {
        event.preventDefault();
        if (!submission) return;
        upload.post(`/submissions/${submission.id}/file`, {
            preserveScroll: true,
            onSuccess: () => { upload.reset(); setInputKey((key) => key + 1); },
        });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Your work</h2><span className="rounded-md bg-muted px-2 py-1 text-xs">{submission ? (submission.status === 'graded' ? 'Awaiting return' : statusLabels[submission.status]) : 'Not started'}</span></div>
            </CardHeader>
            <CardContent className="space-y-5">
                {!submission ? (
                    <><p className="text-sm leading-6 text-muted-foreground">Start a draft to attach your work. Your teacher can review it after you turn it in.</p><Button onClick={() => start.post(`/assignments/${assignmentId}/draft`)} disabled={start.processing}>Start your work</Button></>
                ) : (
                    <>
                        {submission.file_name && submission.download_url && <a href={submission.download_url} className="flex min-h-11 items-center gap-2 rounded-lg border p-3 text-sm text-primary focus-visible:outline-2 focus-visible:outline-offset-4"><Download className="size-4 shrink-0" aria-hidden="true" /><span className="break-all">{submission.file_name}</span></a>}
                        {submission.can_upload ? (
                            <>
                                <form onSubmit={saveFile} className="space-y-3">
                                    <FormField id="work-file" label="Attach or replace your file" error={upload.errors.file}>
                                        <Input key={inputKey} id="work-file" type="file" required accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.zip" onChange={(e) => upload.setData('file', e.target.files?.[0] ?? null)} aria-invalid={!!upload.errors.file} aria-describedby={upload.errors.file ? 'work-file-help work-file-error' : 'work-file-help'} disabled={upload.processing || turnIn.processing} />
                                    </FormField>
                                    <p id="work-file-help" className="text-xs leading-5 text-muted-foreground">PDF, text, documents, slides, images, or ZIP. Maximum 20 MiB.</p>
                                    {upload.progress && <progress className="h-2 w-full" max={100} value={upload.progress.percentage} aria-label="Upload progress" />}
                                    <Button variant="outline" disabled={!upload.data.file || upload.processing || turnIn.processing}><Upload aria-hidden="true" />{upload.processing ? 'Saving…' : 'Save draft file'}</Button>
                                </form>
                                <div className="space-y-3 border-t pt-4">
                                    <p className="text-xs leading-5 text-muted-foreground">Turning in locks this file. Save any selected replacement before you turn in.</p>
                                    <Button disabled={!submission.file_name || !!upload.data.file || upload.processing || turnIn.processing} onClick={() => turnIn.post(`/submissions/${submission.id}/submit`, { preserveScroll: true })}><CheckCircle2 aria-hidden="true" />{turnIn.processing ? 'Turning in…' : 'Turn in'}</Button>
                                    {errors.submission && <p role="alert" className="text-sm text-red-700">{errors.submission}</p>}
                                </div>
                            </>
                        ) : (
                            <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground"><LockKeyhole className="mt-1 size-4 shrink-0" aria-hidden="true" />Your work is locked. {submission.status === 'returned' ? 'Your teacher has returned your result.' : 'Your teacher will review it and return your result.'}</p>
                        )}
                        {submission.status === 'returned' && <div className="space-y-3 rounded-lg bg-primary/5 p-4"><p className="text-sm font-medium">Your grade</p><p className="text-2xl font-semibold tabular-nums">{submission.grade} <span className="text-sm font-normal text-muted-foreground">/ {points}</span></p>{submission.feedback && <p className="whitespace-pre-wrap break-words text-sm leading-6">{submission.feedback}</p>}</div>}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
