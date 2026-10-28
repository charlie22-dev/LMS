import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { AppLayout } from '@/layouts/app-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { SharedProps } from '@/types/portal';

const sections: Record<string, { title: string; description: string }> = {
    profile: { title: 'My Profile', description: 'Your account details and learning space.' },
    registration: { title: 'Registration', description: 'Explore your classroom enrollment.' },
    attendance: { title: 'Attendance', description: 'Your schedule and attendance overview.' },
    exams: { title: 'Exams', description: 'Find assignments and upcoming coursework.' },
    library: { title: 'Library', description: 'Find your learning resources and class materials.' },
    finance: { title: 'Finance', description: 'Your academic finance overview.' },
};
export default function Section({ section }: { section: string }) {
    const { auth } = usePage<SharedProps>().props;
    const item = sections[section];
    return <AppLayout title={item.title} active={section}><Head title={item.title} /><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Your learning space</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{item.title}</h1><p className="mt-2 text-sm text-slate-500">{item.description}</p></div><Card className="max-w-2xl"><CardHeader><BookOpen className="size-6 text-indigo-500" /><h2 className="mt-4 text-lg font-semibold">{section === 'profile' ? auth.user.name : 'Academic overview'}</h2></CardHeader><CardContent><p className="text-sm leading-7 text-slate-500">{section === 'profile' ? `${auth.user.email ?? ''} · ${auth.user.role}` : 'This section is ready for your school’s information. You can explore your available classroom content in My Courses.'}</p><Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">Go to My Courses <ArrowRight className="size-4" /></Link></CardContent></Card></AppLayout>;
}
