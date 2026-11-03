import { Link, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CalendarWork { id: number; title: string; points: number; due_at: string | null; classroom: { id: number; name: string } }
export function dateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function AssignmentCalendar({ month, items, classroomId }: { month: string; items: CalendarWork[]; classroomId?: number }) {
    const [year, monthNumber] = month.split('-').map(Number);
    const first = new Date(year, monthNumber - 1, 1);
    const today = new Date();
    const [selected, setSelected] = useState(dateKey(today).slice(0, 7) === month ? dateKey(today) : dateKey(first));
    const [busy, setBusy] = useState(false);
    const start = new Date(year, monthNumber - 1, 1 - first.getDay());
    const days = Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
    const grouped = new Map<string, CalendarWork[]>();
    for (const item of items) {
        if (!item.due_at) continue;
        const key = dateKey(new Date(item.due_at));
        grouped.set(key, [...(grouped.get(key) || []), item]);
    }
    const chosen = days.find((day) => dateKey(day) === selected) || first;
    const events = grouped.get(selected) || [];
    function go(date: Date) {
        const nextMonth = dateKey(date).slice(0, 7);
        if (nextMonth === month) { setSelected(dateKey(date)); return; }
        setBusy(true);
        router.get('/calendar', { month: nextMonth, ...(classroomId ? { classroom: classroomId } : {}) }, { preserveScroll: true, onFinish: () => setBusy(false) });
    }
    return <section aria-label="Assignment calendar" aria-busy={busy}>
        <div className="overflow-hidden rounded-2xl border bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5"><h2 aria-live="polite" className="text-lg font-semibold tracking-tight sm:text-xl">{first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2><div className="flex items-center gap-1"><Button variant="outline" disabled={busy} onClick={() => go(today)}>Today</Button><button type="button" aria-label="Previous month" disabled={busy || (year === 1000 && monthNumber === 1)} onClick={() => go(new Date(year, monthNumber - 2, 1))} className="flex size-11 items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-40"><ChevronLeft className="size-5" aria-hidden="true" /></button><button type="button" aria-label="Next month" disabled={busy || (year === 9999 && monthNumber === 12)} onClick={() => go(new Date(year, monthNumber, 1))} className="flex size-11 items-center justify-center rounded-lg hover:bg-neutral-100 disabled:opacity-40"><ChevronRight className="size-5" aria-hidden="true" /></button></div></div>
            <table className="w-full table-fixed border-collapse" aria-label="Month calendar"><thead><tr>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => <th key={day} scope="col" className="border-b py-3 text-center text-[10px] font-medium uppercase tracking-wide text-neutral-500"><span className="sm:hidden" aria-hidden="true">{day.slice(0, 1)}</span><span className="sr-only sm:not-sr-only">{day.slice(0, 3)}<span className="sr-only">{day.slice(3)}</span></span></th>)}</tr></thead><tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>{days.slice(week * 7, week * 7 + 7).map((day) => {
                const key = dateKey(day); const tasks = grouped.get(key) || []; const isToday = key === dateKey(today); const isSelected = selected === key;
                return <td key={key} className={cn('border-b border-r p-0 align-top last:border-r-0', day.getMonth() !== first.getMonth() && 'bg-neutral-50', isSelected && 'bg-neutral-100/70')}><div className="h-[76px] min-w-0 sm:h-[154px]"><button type="button" onClick={() => setSelected(key)} aria-label={`${day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}, ${tasks.length} assignments`} aria-pressed={isSelected} aria-current={isToday ? 'date' : undefined} className="flex min-h-11 w-full items-center justify-center rounded-sm focus-visible:outline-offset-[-3px]"><span className={cn('flex size-7 items-center justify-center rounded-full text-xs tabular-nums', isToday ? 'bg-neutral-950 font-semibold text-white' : day.getMonth() !== first.getMonth() ? 'text-neutral-400' : 'text-neutral-700', isSelected && !isToday && 'ring-1 ring-neutral-700')}>{day.getDate()}</span></button><div className="flex justify-center gap-1 sm:hidden" aria-hidden="true">{tasks.slice(0, 3).map((item) => <span key={item.id} className="size-1 rounded-full bg-neutral-700" />)}{tasks.length > 3 && <span className="text-[9px] leading-none">+</span>}</div><div className="hidden space-y-1 px-1 sm:block">{tasks.slice(0, 2).map((item) => <Link key={item.id} href={`/assignments/${item.id}`} title={`${item.title} - ${item.classroom.name}`} className="block truncate rounded border border-neutral-200 bg-white px-1.5 py-1 text-[10px] font-medium text-neutral-700 transition-colors hover:border-neutral-500 hover:bg-neutral-100"><span className="mr-1 text-neutral-400">{new Date(item.due_at!).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>{item.title}</Link>)}{tasks.length > 2 && <button type="button" onClick={() => setSelected(key)} className="min-h-6 rounded px-1 text-[10px] font-semibold text-neutral-500 hover:text-neutral-950">+{tasks.length - 2} more</button>}</div></div></td>;
            })}</tr>)}</tbody></table>
        </div>
        <div className="mt-5 rounded-2xl border bg-white p-4 sm:p-5" aria-live="polite"><div className="mb-4 flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-neutral-500" aria-hidden="true" /><h3 className="text-sm font-semibold">{chosen.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3><span className="ml-auto shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-xs tabular-nums text-neutral-600">{events.length} due</span></div>{events.length ? <ul className="divide-y">{events.map((item) => <li key={item.id}><Link href={`/assignments/${item.id}`} className="flex min-h-16 min-w-0 items-center gap-3 rounded-lg py-3 hover:bg-neutral-50"><Clock3 className="size-4 shrink-0 text-neutral-400" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{item.title}</p><p className="mt-1 break-words text-xs text-neutral-500">{item.classroom.name} / {new Date(item.due_at!).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p></div></Link></li>)}</ul> : <p className="py-4 text-sm text-neutral-500">No assignments due on this day.</p>}</div><p className="mt-3 text-xs text-neutral-500">Due dates and times are shown in your local time.</p>
    </section>;
}
