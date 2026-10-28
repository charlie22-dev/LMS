import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, GraduationCap, Sparkles, TrendingUp } from 'lucide-react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { TimelineItem } from '@/components/ui/timeline-item';
import { NewsDialog } from '@/components/dashboard/news-dialog';
import { demoDashboard, type DashboardData } from '@/data/dashboard';
import { downloadCsv } from '@/lib/download';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types/portal';

export default function Dashboard({ dashboard = demoDashboard }: { dashboard?: DashboardData }) {
    const { auth } = usePage<SharedProps>().props;
    const [courseTab, setCourseTab] = useState('current');
    const [dayOffset, setDayOffset] = useState(0);
    const [keyboardTab, setKeyboardTab] = useState(false);
    const reduceMotion = useReducedMotion();
    const today = new Date();
    const selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset);
    const schedule = dashboard.schedule.filter((item) => item.dayOffset === dayOffset);
    const courses = dashboard.courses.filter((course) => course.status === courseTab);
    const firstName = auth.user.name.split(' ')[0];

    function exportSummary() {
        downloadCsv('academic-preview-summary.csv', [
            ['Academic preview — sample records'], ['Course', 'Code', 'Credits', 'Grade', 'Progress'],
            ...dashboard.courses.map((course) => [course.name, course.code, String(course.credits), course.grade ?? 'In progress', `${course.progress}%`]),
        ]);
        toast.success('Your academic preview summary is ready.');
    }

    return (
        <AppLayout title="Dashboard" active="dashboard">
            <Head title="Dashboard" />
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="size-1.5 rounded-full bg-emerald-500" />YOUR LEARNING, AT A GLANCE <Badge tone="indigo">Sample data</Badge></div>
                    <h1 className="text-[28px] font-semibold tracking-[-0.045em] text-slate-900 sm:text-[32px]">A little progress, every day.</h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Welcome back, {firstName}. Here’s what’s happening in your learning world.</p>
                </div>
                <Button variant="outline" onClick={exportSummary}><ArrowDownToLine aria-hidden="true" />Download summary</Button>
            </div>

            <div className="mb-7 grid gap-4 sm:grid-cols-2 2xl:gap-5 xl:grid-cols-4">
                <Card className="metric-card">
                    <CardContent className="p-5 sm:p-5">
                        <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Current CGPA</span><GraduationCap className="size-[18px] text-slate-400" aria-hidden="true" /></div>
                        <div className="mt-4 flex items-end gap-2"><span className="text-[32px] font-semibold leading-none tracking-[-0.05em] tabular-nums">{dashboard.metrics.cgpa.toFixed(2)}</span><span className="mb-0.5 text-sm text-slate-400">/ 4.00</span></div>
                        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground"><TrendingUp className="size-3.5 text-emerald-600" aria-hidden="true" /><span className="font-medium text-emerald-700">+0.12</span> from last semester</p>
                    </CardContent>
                </Card>
                <Card className="metric-card">
                    <CardContent className="p-5 sm:p-5">
                        <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Current semester</span><CalendarDays className="size-[18px] text-slate-400" aria-hidden="true" /></div>
                        <div className="mt-4 flex items-end gap-2"><span className="text-[32px] font-semibold leading-none tracking-[-0.05em]">{dashboard.metrics.semester}</span><span className="mb-0.5 text-sm text-slate-400">semester</span></div>
                        <p className="mt-4 text-[11px] text-muted-foreground">Academic year {dashboard.academicYear}</p>
                    </CardContent>
                </Card>
                <Card className="metric-card">
                    <CardContent className="p-5 sm:p-5">
                        <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Credits earned</span><BookOpen className="size-[18px] text-slate-400" aria-hidden="true" /></div>
                        <div className="mt-4 flex items-end gap-2"><span className="text-[32px] font-semibold leading-none tracking-[-0.05em] tabular-nums">{dashboard.metrics.credits}</span><span className="mb-0.5 text-sm text-slate-400">/ {dashboard.metrics.totalCredits} credits</span></div>
                        <ProgressBar value={dashboard.metrics.credits} max={dashboard.metrics.totalCredits} label="Degree credits earned" className="mt-[21px]" />
                    </CardContent>
                </Card>
                <Card className="metric-card">
                    <CardContent className="p-5 sm:p-5">
                        <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Attendance</span><Check className="size-[18px] text-slate-400" aria-hidden="true" /></div>
                        <div className="mt-3 flex items-center justify-between gap-3"><div><p className="text-[32px] font-semibold leading-none tracking-[-0.05em] tabular-nums">{dashboard.metrics.attendance}<span className="text-xl">%</span></p><p className="mt-3 text-[11px] font-medium text-emerald-700">You’re doing great</p></div><ProgressRing value={dashboard.metrics.attendance} label="Attendance" /></div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_290px] 2xl:grid-cols-[minmax(0,1fr)_310px]">
                <div className="min-w-0 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-wrap items-center justify-between gap-3 pb-4"><div className="flex items-center gap-2.5"><h2 className="text-[15px] font-semibold tracking-tight">My courses</h2><Badge tone="neutral">{dashboard.courses.filter((course) => course.status === 'current').length} active</Badge></div><Link href="/" className="text-xs font-medium text-primary hover:underline">View all courses <span aria-hidden="true">↗</span></Link></CardHeader>
                        <Tabs.Root value={courseTab} onValueChange={setCourseTab}>
                            <LayoutGroup id="dashboard-course-tabs">
                                <Tabs.List aria-label="Course status" className="mx-5 flex w-fit gap-1 rounded-lg bg-slate-100/80 p-1 sm:mx-6" onKeyDown={() => setKeyboardTab(true)} onPointerDown={() => setKeyboardTab(false)}>
                                    {[['current', 'In progress'], ['completed', 'Completed']].map(([value, label]) => <Tabs.Trigger key={value} value={value} className="relative rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-primary data-[state=active]:text-slate-900">{courseTab === value && <motion.span layoutId="active-course-tab" className="absolute inset-0 rounded-md bg-white shadow-sm" transition={{ duration: reduceMotion || keyboardTab ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] }} />}<span className="relative">{label}</span></Tabs.Trigger>)}
                                </Tabs.List>
                            </LayoutGroup>
                            <Tabs.Content value={courseTab} className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                                <div className="mt-5 hidden grid-cols-[minmax(0,1fr)_64px_108px] gap-4 border-y border-slate-100 bg-slate-50/70 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400 sm:grid"><span>Course details</span><span>Credits</span><span>Progress</span></div>
                                <div className="divide-y divide-slate-100">
                                    {courses.map((course) => <motion.div key={course.code} layout={!reduceMotion && !keyboardTab ? 'position' : false} initial={false} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_64px_108px] sm:px-6">
                                        <div className="flex min-w-0 items-center gap-3"><span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold', course.color)}>{course.monogram}</span><div className="min-w-0"><Link href="/" className="block truncate text-[13px] font-semibold text-slate-700 hover:text-primary">{course.name}</Link><p className="mt-1 text-[11px] text-muted-foreground">{course.code}<span className="mx-1.5 text-slate-300">·</span>{course.instructor}</p></div></div>
                                        <span className="hidden text-xs font-medium text-slate-500 sm:block">{course.credits}.0</span>
                                        <div className="w-20 sm:w-auto">{course.grade ? <Badge tone="success">Grade {course.grade}</Badge> : <><p className="mb-2 text-right text-[10px] font-medium text-slate-400 tabular-nums">{course.progress}%</p><ProgressBar value={course.progress} label={`${course.name} progress`} /></>}</div>
                                    </motion.div>)}
                                </div>
                            </Tabs.Content>
                        </Tabs.Root>
                        <div className="flex items-center justify-between rounded-b-2xl border-t border-slate-100 bg-slate-50/40 px-5 py-3 sm:px-6"><p className="text-[11px] text-slate-400">A little consistency goes a long way.</p><Sparkles className="size-3.5 text-slate-400" aria-hidden="true" /></div>
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="flex items-center justify-between pb-3"><h2 className="text-[15px] font-semibold tracking-tight">Coming up next</h2><CalendarDays className="size-4 text-slate-400" aria-hidden="true" /></CardHeader>
                            <CardContent className="space-y-1">
                                {dashboard.events.map((event) => <Link key={event.title} href={event.href} className="-mx-2 flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-primary"><div className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-slate-100 bg-slate-50 py-1.5"><span className="text-[9px] font-semibold uppercase text-slate-400">{event.month}</span><span className="text-lg font-semibold leading-6 tracking-tight">{event.day}</span></div><div className="min-w-0 flex-1"><p className="text-xs font-semibold leading-5 text-slate-700">{event.title}</p><p className="mt-1 text-[11px] leading-5 text-slate-400">{event.description}</p></div><ArrowUpRight className="mt-1 size-3.5 text-slate-400" aria-hidden="true" /></Link>)}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex items-center justify-between pb-3"><h2 className="text-[15px] font-semibold tracking-tight">Around campus</h2><Badge tone="indigo">News</Badge></CardHeader>
                            <CardContent>
                                <div aria-hidden="true" className="campus-illustration relative mb-4 flex h-24 items-end justify-center overflow-hidden rounded-xl bg-indigo-50"><div className="absolute -right-2 -top-8 size-32 rounded-full border-[22px] border-indigo-100/70" /><div className="absolute left-6 top-5 size-7 rounded-full bg-amber-200/80" /><div className="relative flex h-16 w-44 items-end justify-center gap-2 rounded-t-xl border border-indigo-200 bg-white/70 px-4"><div className="h-11 w-7 rounded-t border border-indigo-200 bg-indigo-100/60" /><div className="h-[74px] w-14 rounded-t-2xl border border-indigo-200 bg-indigo-100/60 pt-3"><div className="mx-auto size-3 rounded-full border-2 border-indigo-300" /></div><div className="h-11 w-7 rounded-t border border-indigo-200 bg-indigo-100/60" /></div></div>
                                <NewsDialog article={dashboard.news} />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-slate-400"><p>Small steps. Meaningful progress.</p><span>Academic overview uses sample records.</span></div>
                </div>

                <aside id="schedule" className="min-w-0 scroll-mt-24 space-y-5">
                    <Card>
                        <CardHeader className="pb-4"><div className="flex items-center justify-between"><h2 className="text-[15px] font-semibold tracking-tight">{dayOffset === 0 ? 'Today’s schedule' : 'Class schedule'}</h2><span className="rounded-md bg-indigo-50 p-1.5 text-primary"><CalendarDays className="size-3.5" aria-hidden="true" /></span></div><div className="mt-4 flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-7 min-h-7" aria-label="Previous day" onClick={() => setDayOffset((day) => day - 1)}><ChevronLeft /></Button><Button variant="ghost" size="icon" className="size-7 min-h-7" aria-label="Next day" onClick={() => setDayOffset((day) => day + 1)}><ChevronRight /></Button></div></div></CardHeader>
                        <CardContent className="pb-3 sm:pb-3">
                            {schedule.length ? schedule.map((item, index) => <TimelineItem key={item.id} item={item} last={index === schedule.length - 1} />) : <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center"><CalendarDays className="mx-auto mb-3 size-6 text-slate-300" aria-hidden="true" /><p className="text-xs font-medium">A little room to breathe.</p><p className="mt-2 text-xs leading-5 text-muted-foreground">No classes in this day’s preview.</p><button onClick={() => setDayOffset(0)} className="mt-4 text-xs font-medium text-primary">Back to today</button></div>}
                        </CardContent>
                        <div className="border-t border-slate-100 p-3"><Link href="/portal/attendance" className="flex min-h-9 items-center justify-center gap-2 rounded-lg text-xs font-medium text-primary transition-colors hover:bg-indigo-50">Attendance overview<ArrowRight className="size-3.5" aria-hidden="true" /></Link></div>
                    </Card>
                    <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-[#f0f2ff] p-5"><div className="mb-4 flex size-9 items-center justify-center rounded-xl border border-white bg-white/80 text-primary"><Clock3 className="size-[18px]" aria-hidden="true" /></div><h3 className="text-sm font-semibold text-indigo-950">Make space for deep work.</h3><p className="mt-2 text-xs leading-6 text-indigo-900/65">Your best ideas need a little breathing room. Find a quiet corner and make it yours.</p><Link href="/portal/library" className="mt-4 inline-flex min-h-8 items-center gap-2 text-xs font-semibold text-primary">Explore the library<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></div>
                </aside>
            </div>
        </AppLayout>
    );
}
