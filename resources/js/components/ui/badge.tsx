import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
export function Badge({ tone = 'neutral', className, ...props }: ComponentProps<'span'> & { tone?: 'neutral' | 'success' | 'indigo' }) {
    return <span className={cn('inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold', tone === 'success' ? 'bg-neutral-50 text-neutral-700' : tone === 'indigo' ? 'bg-neutral-50 text-neutral-600' : 'bg-neutral-100 text-neutral-500', className)} {...props} />;
}
