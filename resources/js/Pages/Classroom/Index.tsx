import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, LogOut } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CreateClassroomForm } from '@/components/classroom/create-classroom-form';
import { AppLayout } from '@/layouts/app-layout';
import type { CursorPage, Person } from '@/types/classroom';

interface ClassroomSummary { id: number; name: string; section: string | null; teacher: Person }

export default function Index({ classrooms }: { classrooms: CursorPage<ClassroomSummary> }) {
    const { auth } = usePage().props as unknown as { auth: { user: Person & { role: string } } };
    const form = useForm({ invite_code: '' });
    function join(event: FormEvent) {
        event.preventDefault();
        form.post('/classrooms/join');
    }
    return (
        <AppLayout title="My Courses" active="courses">
            <Head title="My classrooms" />
            <div>
                <p className="text-sm text-muted-foreground">Welcome back, {auth.user.name}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">My classrooms</h1>
                {auth.user.role === 'teacher' && <CreateClassroomForm />}
                {auth.user.role === 'student' && (
                    <Card className="my-7 max-w-xl"><CardHeader><h2 className="font-semibold">Join a classroom</h2><p className="mt-1 text-sm text-muted-foreground">Enter the seven-character code from your teacher.</p></CardHeader><CardContent><form onSubmit={join} className="flex flex-wrap gap-3"><label className="sr-only" htmlFor="invite-code">Class code</label><input id="invite-code" required minLength={7} maxLength={7} pattern="[A-Za-z0-9]{7}" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={form.data.invite_code} onChange={(e) => form.setData('invite_code', e.target.value.toUpperCase())} aria-invalid={!!form.errors.invite_code} aria-describedby={form.errors.invite_code ? 'code-error' : undefined} className="min-h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 font-mono tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-ring" /><Button disabled={form.processing}>{form.processing ? 'Joining…' : 'Join class'}</Button></form>{form.errors.invite_code && <p id="code-error" role="alert" className="mt-3 text-sm text-red-700">{form.errors.invite_code}</p>}</CardContent></Card>
                )}
                <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {classrooms.data.map((classroom) => <Card key={classroom.id}><CardHeader><h2 className="break-words text-lg font-semibold">{classroom.name}</h2>{classroom.section && <p className="mt-1 text-sm text-muted-foreground">{classroom.section}</p>}</CardHeader><CardContent><p className="mb-5 text-sm text-muted-foreground">{classroom.teacher.name}</p><Button variant="outline" asChild><Link href={`/classrooms/${classroom.id}/stream`}>Open classroom<ArrowRight aria-hidden="true" /></Link></Button></CardContent></Card>)}
                </div>
                {classrooms.data.length === 0 && <p className="mt-10 text-muted-foreground">Your classrooms will appear here once you’ve joined or been assigned one.</p>}
                <nav aria-label="Classroom pagination" className="mt-8 flex justify-between gap-4">{classrooms.prev_page_url ? <Button variant="outline" asChild><Link href={classrooms.prev_page_url}>Newer classrooms</Link></Button> : <span />}{classrooms.next_page_url && <Button variant="outline" asChild><Link href={classrooms.next_page_url}>Older classrooms</Link></Button>}</nav>
            </div>
        </AppLayout>
    );
}
