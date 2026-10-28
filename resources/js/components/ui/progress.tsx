import { cn } from '@/lib/utils';
export function ProgressBar({ value, max = 100, label, className }: { value: number; max?: number; label: string; className?: string }) {
    const percent = max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
    return <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} className={cn('h-1.5 overflow-hidden rounded-full bg-slate-100', className)}><div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} /></div>;
}
export function ProgressRing({ value, label }: { value: number; label: string }) {
    const percent = Math.max(0, Math.min(100, value));
    return <svg role="img" aria-label={`${label}: ${percent}%`} width="54" height="54" viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" fill="none" stroke="#e8eaf5" strokeWidth="5" /><circle cx="27" cy="27" r="22" fill="none" stroke="#4f46e5" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${percent} 100`} pathLength="100" transform="rotate(-90 27 27)" /><path d="m22 27 3 3 7-7" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
