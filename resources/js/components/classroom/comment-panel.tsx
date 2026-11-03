import { Link, router, useForm } from '@inertiajs/react';
import { LockKeyhole, MessageSquare, RefreshCw, Send, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import type { CursorPage, Person } from '@/types/classroom';

export interface ClassroomComment { id: number; body: string; author: Person; created_at: string; can_delete: boolean }

function CommentRow({ comment }: { comment: ClassroomComment }) {
    const [confirming, setConfirming] = useState(false);
    const remove = useForm({});
    return <li className="flex min-w-0 gap-3 border-b py-4 last:border-b-0"><span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold">{comment.author.name.split(' ').slice(0, 2).map((part) => part[0]).join('')}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="text-sm font-semibold">{comment.author.name}</span><time dateTime={comment.created_at} className="text-xs text-neutral-500">{new Date(comment.created_at).toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-700">{comment.body}</p>{confirming && <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs">Delete this comment?</span><Button className="min-h-10 px-3 text-xs" disabled={remove.processing} onClick={() => remove.delete(`/comments/${comment.id}`, { preserveScroll: true })}>Delete</Button><Button className="min-h-10 px-3 text-xs" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button></div>}</div>{comment.can_delete && !confirming && <button type="button" aria-label={`Delete comment by ${comment.author.name}`} onClick={() => setConfirming(true)} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"><Trash2 className="size-4" aria-hidden="true" /></button>}</li>;
}

export function CommentPanel({ assignmentId, visibility, comments, canPost, studentId }: { assignmentId: number; visibility: 'class' | 'private'; comments: CursorPage<ClassroomComment>; canPost: boolean; studentId?: number | null }) {
    const form = useForm({ body: '', visibility, student_id: studentId ?? null });
    const [refreshing, setRefreshing] = useState(false);
    const isPrivate = visibility === 'private';
    const heading = isPrivate ? 'Private comments' : 'Class comments';
    function submit(event: FormEvent) {
        event.preventDefault();
        if (!form.data.body.trim() || form.processing) return;
        form.post(`/assignments/${assignmentId}/comments`, { preserveScroll: true, onSuccess: () => form.reset('body') });
    }
    return <Card id={isPrivate ? 'private-comments' : 'class-comments'}><CardHeader><div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-base font-semibold">{isPrivate ? <LockKeyhole className="size-4" aria-hidden="true" /> : <MessageSquare className="size-4" aria-hidden="true" />}{heading}</h2><button type="button" disabled={refreshing} aria-label={`Refresh ${heading.toLowerCase()}`} onClick={() => { setRefreshing(true); router.reload({ only: [isPrivate ? 'privateComments' : 'classComments'], onFinish: () => setRefreshing(false) }); }} className="flex size-10 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"><RefreshCw className="size-4" aria-hidden="true" /></button></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{isPrivate ? 'Only this student and the class teacher can see this conversation.' : 'Visible to everyone in this classroom.'}</p></CardHeader><CardContent>{comments.next_page_url && <Link href={comments.next_page_url} preserveScroll className="inline-flex min-h-10 items-center text-xs font-medium underline">Older comments</Link>}{comments.data.length ? <ul aria-label={heading} className="mb-4">{[...comments.data].reverse().map((comment) => <CommentRow key={comment.id} comment={comment} />)}</ul> : <p className="mb-5 text-sm text-neutral-500">No comments yet. Start the conversation.</p>}{comments.prev_page_url && <Link href={comments.prev_page_url} preserveScroll className="mb-3 inline-flex min-h-10 items-center text-xs font-medium underline">Newer comments</Link>}{canPost && <form onSubmit={submit} className="space-y-3" aria-busy={form.processing}><label htmlFor={`${visibility}-comment`} className="block text-sm font-medium">{isPrivate ? 'Add a private comment' : 'Add a class comment'}</label><Textarea id={`${visibility}-comment`} rows={3} required maxLength={5000} value={form.data.body} onChange={(event) => form.setData('body', event.target.value)} placeholder={isPrivate ? 'Ask a question or share feedback...' : 'Share a question with the class...'} aria-invalid={!!form.errors.body} aria-describedby={form.errors.body ? `${visibility}-comment-error` : undefined} />{form.errors.body && <p id={`${visibility}-comment-error`} role="alert" className="text-sm">{form.errors.body}</p>}<div className="flex justify-end"><Button type="submit" disabled={form.processing || !form.data.body.trim()}><Send className="size-4" aria-hidden="true" />{form.processing ? 'Posting...' : isPrivate ? 'Send private comment' : 'Post class comment'}</Button></div></form>}</CardContent></Card>;
}
