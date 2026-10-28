import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: ComponentProps<'input'>) {
    return <input className={cn('flex min-h-11 w-full min-w-0 rounded-lg border bg-background px-3 py-2 text-base outline-none file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-invalid:border-red-600 sm:text-sm', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
    return <textarea className={cn('flex min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-base leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-invalid:border-red-600 sm:text-sm', className)} {...props} />;
}
