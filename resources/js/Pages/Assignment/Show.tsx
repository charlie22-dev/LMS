import { CommentPanel, type ClassroomComment } from '@/components/classroom/comment-panel';
import { PostAttachments } from '@/components/classroom/post-attachments';
import type { PostAttachment } from '@/types/classroom';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CalendarDays, ClipboardList } from 'lucide-react';
import { StudentWork } from '@/components/assignment/student-work';
import { AppLayout } from '@/layouts/app-layout';
import { SubmissionReview } from '@/components/assignment/submission-review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { CursorPage, Person } from '@/types/classroom';
import type { ReviewedSubmission, Submission } from '@/types/submission';

interface Assignment {
    type: 'assignment' | 'material' | 'announcement'; attachments: PostAttachment[];
    id: number; title: string; instructions: string | null; points: number; due_at: string | null;
    author: Person; classroom: { id: number; name: string }; class_average: string | null;
}

interface Props {
    assignment: Assignment;
    classComments: CursorPage<ClassroomComment>;
    privateComments: CursorPage<ClassroomComment> | null;
    commentSettings: { can_post: boolean; can_manage: boolean; student_id: number | null; students: Person[] };
    permissions: { review: boolean; submit: boolean };
    submission: Submission | null;
    submissions: CursorPage<ReviewedSubmission> | null;
}

export default function Show({ assignment, permissions, submission, submissions, classComments, privateComments, commentSettings }: Props) {
    const flash = usePage().props.flash as { success?: string } | undefined;
    return (
        <AppLayout title="Assignment" active="courses">
            <Head title={assignment.title} />
            <div className="mx-auto max-w-6xl">
                <Link href={`/classrooms/${assignment.classroom.id}/stream`} className="mb-6 inline-flex min-h-12 max-w-full items-center gap-2 break-words rounded text-sm text-primary focus-visible:outline-2 focus-visible:outline-offset-4"><ArrowLeft className="size-4" aria-hidden="true" />{assignment.classroom.name}</Link>
                {flash?.success && <p role="status" className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">{flash.success}</p>}
                <div className={permissions.submit ? 'grid min-w-0 items-start gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]' : ''}>
                    <Card className="min-w-0">
                        <CardHeader><ClipboardList className="mb-4 size-7 text-primary" aria-hidden="true" /><h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{assignment.title}</h1><p className="mt-3 break-words text-sm text-muted-foreground">{assignment.author.name} · {assignment.type === 'assignment' ? `${assignment.points} points` : assignment.type}</p></CardHeader>
                        <CardContent>
                            {assignment.type === 'assignment' && <p className="mb-6 flex flex-wrap items-center gap-2 border-b pb-5 text-sm leading-6 text-muted-foreground"><CalendarDays className="size-4 shrink-0" aria-hidden="true" />{assignment.due_at ? <>Due <time dateTime={assignment.due_at}>{new Date(assignment.due_at).toLocaleString()}</time></> : 'No due date'}</p>}
                            <h2 className="text-sm font-semibold">{assignment.type === 'assignment' ? 'Instructions' : 'Details'}</h2>
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{assignment.instructions || 'No additional instructions. Refer to your teacher for details.'}</p>
                            <PostAttachments attachments={assignment.attachments} />
                        </CardContent>
                    </Card>
                    {permissions.submit && <StudentWork assignmentId={assignment.id} points={assignment.points} submission={submission} />}
                </div>
                <div className="mt-6 grid min-w-0 items-start gap-5 xl:grid-cols-2">
                    <CommentPanel assignmentId={assignment.id} visibility="class" comments={classComments} canPost={commentSettings.can_post} />
                    {assignment.type === 'assignment' && (privateComments || commentSettings.can_manage) && <div className="min-w-0 space-y-3">
                        {commentSettings.can_manage && <div className="rounded-xl border bg-white p-4"><label htmlFor="comment-student" className="mb-2 block text-sm font-medium">Private conversation with</label><select id="comment-student" value={commentSettings.student_id ?? ''} onChange={(event) => router.get(`/assignments/${assignment.id}`, { student: Number(event.target.value) }, { preserveScroll: true })} className="min-h-11 w-full rounded-lg border bg-white px-3 text-sm" disabled={!commentSettings.students.length}>{commentSettings.students.length ? commentSettings.students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>) : <option value="">No students enrolled</option>}</select></div>}
                        {privateComments && <CommentPanel key={commentSettings.student_id} assignmentId={assignment.id} visibility="private" studentId={commentSettings.student_id} comments={privateComments} canPost={commentSettings.can_post} />}
                    </div>}
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
