import { CalendarDays, ClipboardList } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { StreamItem } from '@/types/classroom';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function AssignmentCard({ item }: { item: StreamItem }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><ClipboardList className="size-5" aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{item.author.name}</span> posted an assignment</p>
                        <time className="mt-1 block text-xs text-muted-foreground" dateTime={item.created_at}>{dateFormat.format(new Date(item.created_at))}</time>
                    </div>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium tabular-nums">{item.points} pts</span>
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="break-words text-lg font-semibold tracking-tight"><Link href={`/assignments/${item.id}`} className="rounded hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">{item.title}</Link></h3>
                {item.instructions && (
                    <details className="mt-3 text-sm">
                        <summary className="w-fit rounded text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">Read instructions</summary>
                        <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-muted-foreground">{item.instructions}</p>
                    </details>
                )}
                <div className="mt-5 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    {item.due_at ? <span>Due <time dateTime={item.due_at}>{dateFormat.format(new Date(item.due_at))}</time></span> : <span>No due date</span>}
                </div>
                <Link href={`/assignments/${item.id}`} className="mt-4 inline-flex min-h-10 items-center rounded text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">Open assignment</Link>
            </CardContent>
        </Card>
    );
}
