import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: ComponentProps<'div'>) {
    return <div data-slot="card" className={cn('rounded-2xl border border-[#e2eaea] bg-card text-card-foreground shadow-[0_2px_14px_rgba(35,66,74,0.045)]', className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
    return <div data-slot="card-header" className={cn('p-5 sm:p-6', className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
    return <div data-slot="card-content" className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)} {...props} />;
}
