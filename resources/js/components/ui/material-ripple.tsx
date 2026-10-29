import { motion, useReducedMotion } from 'framer-motion';
import { useState, type ComponentProps, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';

export function MaterialRippleButton({ className, children, onPointerDown, ...props }: ComponentProps<'button'>) {
    const reduced = useReducedMotion();
    const [ripple, setRipple] = useState<{ x: number; y: number; size: number; id: number } | null>(null);
    function press(event: PointerEvent<HTMLButtonElement>) {
        onPointerDown?.(event);
        if (reduced || event.defaultPrevented) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setRipple({ x: event.clientX - rect.left, y: event.clientY - rect.top, size: Math.max(rect.width, rect.height) * 2, id: Date.now() });
    }
    return <button {...props} onPointerDown={press} className={cn('relative isolate overflow-hidden', className)}>{children}{ripple && <motion.span key={ripple.id} aria-hidden="true" className="pointer-events-none absolute rounded-full bg-current" style={{ width: ripple.size, height: ripple.size, left: ripple.x - ripple.size / 2, top: ripple.y - ripple.size / 2 }} initial={{ transform: 'scale(0.1)', opacity: 0.15 }} animate={{ transform: 'scale(1)', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} onAnimationComplete={() => setRipple(null)} />}</button>;
}
