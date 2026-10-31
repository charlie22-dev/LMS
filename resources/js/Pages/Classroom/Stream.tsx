import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, BookOpen, ClipboardList, Copy, RefreshCw, Users } from 'lucide-react';
import { useState } from 'react';
import { AssignmentCard } from '@/components/classroom/assignment-card';
import { AppLayout } from '@/layouts/app-layout';
import { CreateAssignmentForm } from '@/components/classroom/create-assignment-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useClassroomStream } from '@/hooks/use-classroom-stream';
import type { Classroom, CursorPage, StreamItem } from '@/types/classroom';

interface Props { classroom: Classroom; streamItems: CursorPage<StreamItem> }

function InviteCode({ code }: { code: string }) {
    const [message, setMessage] = useState('');
    async function copy() {
        try {
            await navigator.clipboard.writeText(code);
            setMessage('Class code copied.');
        } catch {
            setMessage('Select and copy the class code manually.');
        }
    }
    return (
        <Card>
            <CardHeader><h2 className="text-sm font-semibold">Class code</h2></CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-2">
                    <code className="select-all text-xl font-semibold tracking-[0.15em] text-primary">{code}</code>
                    <Button variant="ghost" size="icon" onClick={() => void copy()} aria-label="Copy class code"><Copy aria-hidden="true" /></Button>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">Share this code with students to invite them to your classroom.</p>
                <p role="status" className="mt-2 text-xs text-primary">{message}</p>
            </CardContent>
        </Card>
    );
}

export default function Stream({ classroom, streamItems }: Props) {
    const { hasUpdates, dismissUpdates } = useClassroomStream(classroom.id);
    const [refreshing, setRefreshing] = useState(false);
    const flash = usePage().props.flash as { success?: string } | undefined;

    function refresh() {
        setRefreshing(true);
        router.get(`/classrooms/${classroom.id}/stream`, {}, {
            only: ['streamItems'], preserveState: true, preserveScroll: true,
            onSuccess: dismissUpdates, onFinish: () => setRefreshing(false),
        });
    }

    return (
        <AppLayout title="Class stream" active="courses">
            <Head title={classroom.name} />
            <a href="#main" className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to stream</a>
            <div id="main" className="mx-auto max-w-6xl">
                <Link href="/" className="mb-5 inline-flex items-center gap-2 rounded text-sm text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4"><ArrowLeft className="size-4" aria-hidden="true" />All classrooms</Link>
                <section aria-label="Classroom overview" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#245ab5] via-[#28688e] to-[#187b78] p-7 text-white sm:p-10">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 size-80 rounded-full border-[44px] border-white/5" />
                    <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-[#d4f2ed]">Your learning space</p>
                    <h1 className="relative mt-5 max-w-3xl break-words text-3xl font-semibold tracking-tight sm:text-4xl">{classroom.name}</h1>
                    {classroom.section && <p className="relative mt-2 text-emerald-50/85">{classroom.section}</p>}
                    <div className="relative mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-emerald-50/85">
                        <span>{classroom.teacher.name}</span>
                        <span className="flex items-center gap-2"><Users className="size-4" aria-hidden="true" />{classroom.students_count} {classroom.students_count === 1 ? 'student' : 'students'}</span>
                    </div>
                </section>
                <div className="mb-7 mt-3 flex items-center justify-between border-b">
                    <h2 className="border-b-2 border-primary px-1 py-4 text-sm font-semibold text-primary">Class stream</h2>
                    <Button variant="ghost" disabled={refreshing} onClick={refresh}><RefreshCw aria-hidden="true" />{refreshing ? 'Refreshing…' : 'Refresh'}</Button>
                </div>
                {flash?.success && <p role="status" className="mb-5 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">{flash.success}</p>}
                <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <aside className="space-y-5" aria-label="Class information">
                        {classroom.invite_code && <InviteCode code={classroom.invite_code} />}
                        <Card>
                            <CardHeader><h2 className="text-sm font-semibold">A place to stay on track</h2></CardHeader>
                            <CardContent><p className="text-sm leading-6 text-muted-foreground">Find assignments, instructions, and due dates in your class stream. Newest assignments appear first.</p></CardContent>
                        </Card>
                    </aside>
                    <section className="min-w-0 space-y-5" aria-label="Assignments" aria-busy={refreshing}>
                        {classroom.can_manage && <CreateAssignmentForm classroomId={classroom.id} />}
                        {hasUpdates && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><span>There are new updates in your classroom.</span><Button onClick={refresh} disabled={refreshing}>Show updates</Button></div>}
                        {streamItems.data.length > 0 ? streamItems.data.map((item) => <AssignmentCard key={item.id} item={item} />) : (
                            <Card className="px-6 py-16 text-center">
                                <ClipboardList className="mx-auto size-9 text-primary/60" aria-hidden="true" />
                                <h3 className="mt-4 text-lg font-semibold">You’re all caught up</h3>
                                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Assignments will appear here when your teacher posts them. Check back soon.</p>
                            </Card>
                        )}
                        {(streamItems.prev_page_url || streamItems.next_page_url) && (
                            <nav aria-label="Stream pagination" className="flex justify-between gap-4 py-2">
                                {streamItems.prev_page_url ? <Button variant="outline" asChild><Link href={streamItems.prev_page_url} only={['streamItems']} preserveScroll><ArrowLeft aria-hidden="true" />Newer</Link></Button> : <span />}
                                {streamItems.next_page_url && <Button variant="outline" asChild><Link href={streamItems.next_page_url} only={['streamItems']} preserveScroll>Older<ArrowRight aria-hidden="true" /></Link></Button>}
                            </nav>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
