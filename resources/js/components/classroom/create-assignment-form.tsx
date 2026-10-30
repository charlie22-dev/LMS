import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input, Textarea } from '@/components/ui/input';

export function CreateAssignmentForm({ classroomId }: { classroomId: number }) {
    const form = useForm({ title: '', instructions: '', points: '100', due_at: '' });

    function submit(event: FormEvent) {
        event.preventDefault();
        if (form.processing) return;
        form.transform((data) => ({
            ...data,
            points: Number(data.points),
            due_at: data.due_at ? new Date(data.due_at).toISOString() : null,
        }));
        form.post(`/classrooms/${classroomId}/assignments`);
    }

    return (
        <Card>
            <details className="p-5 sm:p-6">
                <summary className="flex w-fit items-center gap-2 rounded font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-4"><Plus className="size-5" aria-hidden="true" />Post an assignment</summary>
                <form onSubmit={submit} aria-busy={form.processing} className="mt-5 space-y-4">
                    <FormField id="assignment-title" label="Title" error={form.errors.title}>
                        <Input id="assignment-title" required autoComplete="off" maxLength={200} value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} aria-invalid={!!form.errors.title} aria-describedby={form.errors.title ? 'assignment-title-error' : undefined} />
                    </FormField>
                    <FormField id="assignment-instructions" label="Instructions (optional)" error={form.errors.instructions}>
                        <Textarea id="assignment-instructions" rows={5} maxLength={20000} value={form.data.instructions} onChange={(e) => form.setData('instructions', e.target.value)} aria-invalid={!!form.errors.instructions} aria-describedby={form.errors.instructions ? 'assignment-instructions-error' : undefined} />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField id="assignment-points" label="Points" error={form.errors.points}>
                            <Input id="assignment-points" type="number" inputMode="numeric" required min={0} max={65535} step={1} value={form.data.points} onChange={(e) => form.setData('points', e.target.value)} aria-invalid={!!form.errors.points} aria-describedby={form.errors.points ? 'assignment-points-error' : undefined} />
                        </FormField>
                        <FormField id="assignment-due" label="Due date (optional, your local time)" error={form.errors.due_at}>
                            <Input id="assignment-due" type="datetime-local" step={60} value={form.data.due_at} onChange={(e) => form.setData('due_at', e.target.value)} aria-invalid={!!form.errors.due_at} aria-describedby={form.errors.due_at ? 'assignment-due-error' : undefined} />
                        </FormField>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">Posting makes this assignment visible to everyone in the classroom.</p>
                    <Button type="submit" disabled={form.processing}>{form.processing ? 'Posting…' : 'Post assignment'}</Button>
                </form>
            </details>
        </Card>
    );
}
