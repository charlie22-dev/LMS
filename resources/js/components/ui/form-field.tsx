import type { ReactNode } from 'react';

export function FormField({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium text-foreground">{label}</label>
            {children}
            {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
    );
}
