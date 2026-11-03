import type { PageProps } from '@inertiajs/core';
export interface NavigationClassroom { id: number; name: string; section: string | null }
export interface SharedProps extends PageProps { navigationClassrooms: NavigationClassroom[]; auth: { user: { id: number; name: string; email?: string; role: string } } }
