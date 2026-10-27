import { Head, useForm } from '@inertiajs/react';
import { BookOpen } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function Login() {
    const form = useForm({ email: '', password: '' });
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/login', { onFinish: () => form.reset('password') });
    }
    return (
        <main className="flex min-h-dvh items-center justify-center p-5">
            <Head title="Sign in" />
            <Card className="w-full max-w-md">
                <CardHeader><BookOpen className="mb-5 size-8 text-primary" aria-hidden="true" /><h1 className="text-2xl font-semibold tracking-tight">Welcome to Classwork</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to your learning space.</p></CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-5">
                        <div><label className="text-sm font-medium" htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" required autoFocus value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} aria-invalid={!!form.errors.email} aria-describedby={form.errors.email ? 'email-error' : undefined} className="mt-2 block h-11 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring" />{form.errors.email && <p id="email-error" role="alert" className="mt-2 text-sm text-red-700">{form.errors.email}</p>}</div>
                        <div><label className="text-sm font-medium" htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} className="mt-2 block h-11 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring" />{form.errors.password && <p role="alert" className="mt-2 text-sm text-red-700">{form.errors.password}</p>}</div>
                        <Button className="w-full" disabled={form.processing}>{form.processing ? 'Signing in…' : 'Sign in'}</Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
