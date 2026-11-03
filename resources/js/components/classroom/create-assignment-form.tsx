import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input, Textarea } from '@/components/ui/input';

export function CreateAssignmentForm({ classroomId }: { classroomId: number }) {
    const [fileKey, setFileKey] = useState(0);
    const form = useForm<{ type: 'assignment' | 'material' | 'announcement'; title: string; instructions: string; points: string; due_at: string; files: File[] }>({ type: 'assignment', title: '', instructions: '', points: '100', due_at: '', files: [] });

    function submit(event: FormEvent) {
        event.preventDefault();
        if (form.processing) return;
        form.transform((data) => ({
            ...data,
            points: Number(data.points),
            due_at: data.due_at ? new Date(data.due_at).toISOString() : null,
        }));
        form.post(`/classrooms/${classroomId}/assignments`, { forceFormData: true, onSuccess: () => { form.reset(); setFileKey((key) => key + 1); } });
    }

    return (
        <Card>
            <details className="p-5 sm:p-6">
                <summary className="flex w-fit items-center gap-2 rounded font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-4"><Plus className="size-5" aria-hidden="true" />Create a post</summary>
                <form onSubmit={submit} aria-busy={form.processing} className="mt-5 space-y-4">
                    <fieldset><legend className="mb-2 text-sm font-medium">Post type</legend><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{(['assignment', 'material', 'announcement'] as const).map((type) => <label key={type} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm capitalize ${form.data.type === type ? 'border-neutral-900 bg-neutral-100 font-semibold' : 'border-neutral-200'}`}><input type="radio" name="post-type" value={type} checked={form.data.type === type} onChange={() => form.setData('type', type)} className="accent-neutral-900" />{type === 'material' ? 'Materials' : type === 'assignment' ? 'Assignment' : 'Announcement'}</label>)}</div>{form.errors.type && <p role="alert" className="mt-2 text-sm">{form.errors.type}</p>}</fieldset>
                    <FormField id="assignment-title" label="Title" error={form.errors.title}>
                        <Input id="assignment-title" required autoComplete="off" maxLength={200} value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} aria-invalid={!!form.errors.title} aria-describedby={form.errors.title ? 'assignment-title-error' : undefined} />
                    </FormField>
                    <FormField id="assignment-instructions" label="Instructions (optional)" error={form.errors.instructions}>
                        <Textarea id="assignment-instructions" rows={5} maxLength={20000} value={form.data.instructions} onChange={(e) => form.setData('instructions', e.target.value)} aria-invalid={!!form.errors.instructions} aria-describedby={form.errors.instructions ? 'assignment-instructions-error' : undefined} />
                    </FormField>
                    {form.data.type === 'assignment' && <div className="grid gap-4 sm:grid-cols-2">
                        <FormField id="assignment-points" label="Points" error={form.errors.points}>
                            <Input id="assignment-points" type="number" inputMode="numeric" required min={0} max={65535} step={1} value={form.data.points} onChange={(e) => form.setData('points', e.target.value)} aria-invalid={!!form.errors.points} aria-describedby={form.errors.points ? 'assignment-points-error' : undefined} />
                        </FormField>
                        <FormField id="assignment-due" label="Due date (optional, your local time)" error={form.errors.due_at}>
                            <Input id="assignment-due" type="datetime-local" step={60} value={form.data.due_at} onChange={(e) => form.setData('due_at', e.target.value)} aria-invalid={!!form.errors.due_at} aria-describedby={form.errors.due_at ? 'assignment-due-error' : undefined} />
                        </FormField>
                    </div>}
                    <FormField id="teacher-files" label="Attachments (optional)" error={form.errors.files}>
                        <Input key={fileKey} id="teacher-files" type="file" multiple accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.zip" onChange={(event) => form.setData('files', Array.from(event.target.files || []))} aria-describedby="teacher-files-help" />
                    </FormField>
                    <p id="teacher-files-help" className="text-xs leading-5 text-muted-foreground">Up to 5 files, 20 MiB each. Documents, slides, spreadsheets, images, text, and ZIP.</p>
                    {form.data.files.map((file, index) => <div key={`${index}-${file.name}`} className="rounded-lg border p-3 text-sm"><span className="break-all">{file.name}</span>{(form.errors as Record<string, string>)[`files.${index}`] && <p role="alert" className="mt-1">{(form.errors as Record<string, string>)[`files.${index}`]}</p>}</div>)}
                    {form.progress && <progress className="w-full accent-neutral-900" value={form.progress.percentage} max={100} aria-label="Attachment upload progress" />}
                    <p className="text-xs leading-5 text-muted-foreground">Posting makes this post visible to everyone in the classroom.</p>
                    <Button type="submit" disabled={form.processing}>{form.processing ? 'Posting…' : `Post ${form.data.type}`}</Button>
                </form>
            </details>
        </Card>
    );
}
