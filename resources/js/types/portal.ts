import type { PageProps } from '@inertiajs/core';
export interface SharedProps extends PageProps { auth: { user: { id: number; name: string; email?: string; role: string } } }
