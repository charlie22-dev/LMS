import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
export function Badge({ tone = 'neutral', className, ...props }: ComponentProps<'span'> & { tone?: 'neutral' | 'success' | 'indigo' }) {
    return <span className={cn('inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold', tone === 'success' ? 'bg-emerald-50 text-emerald-700' : tone === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500', className)} {...props} />;
}
