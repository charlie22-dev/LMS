import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

export function CreateClassroomForm() {
    const form = useForm({ name: '', section: '' });

    function submit(event: FormEvent) {
        event.preventDefault();
        if (form.processing) return;
        form.post('/classrooms');
    }

    return (
        <Card className="my-7 max-w-xl">
            <details className="group p-5 sm:p-6">
                <summary className="flex w-fit items-center gap-2 rounded font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-4"><Plus className="size-5" aria-hidden="true" />Create a classroom</summary>
                <p className="mt-3 text-sm text-muted-foreground">Give your class a home. You can invite students with its class code.</p>
                <form onSubmit={submit} aria-busy={form.processing} className="mt-5 space-y-4">
                    <FormField id="class-name" label="Class name" error={form.errors.name}>
                        <Input id="class-name" required autoComplete="off" maxLength={160} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} aria-invalid={!!form.errors.name} aria-describedby={form.errors.name ? 'class-name-error' : undefined} />
                    </FormField>
                    <FormField id="class-section" label="Section (optional)" error={form.errors.section}>
                        <Input id="class-section" autoComplete="off" maxLength={100} value={form.data.section} onChange={(e) => form.setData('section', e.target.value)} aria-invalid={!!form.errors.section} aria-describedby={form.errors.section ? 'class-section-error' : undefined} />
                    </FormField>
                    <Button type="submit" disabled={form.processing}>{form.processing ? 'Creating…' : 'Create classroom'}</Button>
                </form>
            </details>
        </Card>
    );
}
