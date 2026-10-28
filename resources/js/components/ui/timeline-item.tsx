import { MapPin } from 'lucide-react';
import type { DashboardData } from '@/data/dashboard';
export function TimelineItem({ item, last }: { item: DashboardData['schedule'][number]; last: boolean }) {
    return <div className="relative flex gap-3 pb-5"><div className="relative flex w-4 shrink-0 justify-center"><span className="relative z-10 mt-1 size-2.5 rounded-full border-2 border-indigo-500 bg-white" />{!last && <span className="absolute bottom-0 top-3 w-px bg-slate-200" />}</div><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold text-slate-400">{item.time}</p><div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3"><p className="text-xs font-semibold leading-5">{item.title}</p><p className="mt-1.5 text-[10px] text-slate-500">{item.duration}</p><p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400"><MapPin className="size-3" aria-hidden="true" />{item.room}</p></div></div></div>;
}
