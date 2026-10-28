import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CalendarDays, ClipboardList } from 'lucide-react';
import { StudentWork } from '@/components/assignment/student-work';
import { AppLayout } from '@/layouts/app-layout';
import { SubmissionReview } from '@/components/assignment/submission-review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { CursorPage, Person } from '@/types/classroom';
import type { ReviewedSubmission, Submission } from '@/types/submission';

interface Assignment {
    id: number; title: string; instructions: string | null; points: number; due_at: string | null;
    author: Person; classroom: { id: number; name: string }; class_average: string | null;
}

interface Props {
    assignment: Assignment;
    permissions: { review: boolean; submit: boolean };
    submission: Submission | null;
    submissions: CursorPage<ReviewedSubmission> | null;
}

export default function Show({ assignment, permissions, submission, submissions }: Props) {
    const flash = usePage().props.flash as { success?: string } | undefined;
    return (
        <AppLayout title="Assignment" active="courses">
            <Head title={assignment.title} />
            <div className="mx-auto max-w-6xl">
                <Link href={`/classrooms/${assignment.classroom.id}/stream`} className="mb-7 inline-flex min-h-10 items-center gap-2 rounded text-sm text-primary focus-visible:outline-2 focus-visible:outline-offset-4"><ArrowLeft className="size-4" aria-hidden="true" />{assignment.classroom.name}</Link>
                {flash?.success && <p role="status" className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">{flash.success}</p>}
                <div className={permissions.submit ? 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]' : ''}>
                    <Card className="min-w-0">
                        <CardHeader><ClipboardList className="mb-4 size-7 text-primary" aria-hidden="true" /><h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{assignment.title}</h1><p className="mt-3 text-sm text-muted-foreground">{assignment.author.name} · {assignment.points} points</p></CardHeader>
                        <CardContent>
                            <p className="mb-6 flex items-center gap-2 border-b pb-5 text-sm text-muted-foreground"><CalendarDays className="size-4 shrink-0" aria-hidden="true" />{assignment.due_at ? <>Due <time dateTime={assignment.due_at}>{new Date(assignment.due_at).toLocaleString()}</time></> : 'No due date'}</p>
                            <h2 className="text-sm font-semibold">Instructions</h2>
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{assignment.instructions || 'No additional instructions. Refer to your teacher for details.'}</p>
                        </CardContent>
                    </Card>
                    {permissions.submit && <StudentWork assignmentId={assignment.id} points={assignment.points} submission={submission} />}
                </div>
                {permissions.review && submissions && (
                    <section className="mt-10 space-y-5" aria-label="Submission review">
                        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold tracking-tight">Student work</h2><p className="text-sm text-muted-foreground">Class average: <span className="font-medium tabular-nums text-foreground">{assignment.class_average === null ? 'Not graded yet' : `${assignment.class_average} / ${assignment.points}`}</span></p></div>
                        <p className="text-sm text-muted-foreground">Drafts stay private. Work appears here when a student turns it in. Late work is accepted and marked.</p>
                        {submissions.data.length === 0 ? <Card className="p-8 text-sm text-muted-foreground">No work has been turned in yet.</Card> : submissions.data.map((item) => <SubmissionReview key={`${item.id}-${item.status}-${item.grade}-${item.feedback}`} submission={item} points={assignment.points} dueAt={assignment.due_at} />)}
                        {(submissions.prev_page_url || submissions.next_page_url) && <nav aria-label="Submissions pagination" className="flex justify-between gap-4">{submissions.prev_page_url ? <Button variant="outline" asChild><Link href={submissions.prev_page_url} preserveScroll><ArrowLeft aria-hidden="true" />Newer</Link></Button> : <span />}{submissions.next_page_url && <Button variant="outline" asChild><Link href={submissions.next_page_url} preserveScroll>Older<ArrowRight aria-hidden="true" /></Link></Button>}</nav>}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
