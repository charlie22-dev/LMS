import * as Dialog from '@radix-ui/react-dialog';
import { Eye, FileText, LoaderCircle, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

function PreviewContent({ url, name }: { url: string; name: string }) {
    const [source, setSource] = useState<string | null>(null);
    const [mime, setMime] = useState('');
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        let objectUrl: string | undefined;
        async function load() {
            try {
                const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}preview=1`, { signal: controller.signal, headers: { Accept: 'application/octet-stream' } });
                if (!response.ok) throw new Error(response.status === 415 ? 'A preview is not available for this file format. Ask your teacher for a PDF version.' : 'The file could not be opened. Check your access and try again.');
                if (response.redirected) throw new Error('Your session has expired. Sign in again to preview this file.');
                const blob = await response.blob();
                if (!['application/pdf', 'image/jpeg', 'image/png', 'text/plain'].includes(blob.type.split(';')[0])) throw new Error('This file format cannot be previewed.');
                if (controller.signal.aborted) return;
                setMime(blob.type);
                if (blob.type.startsWith('text/plain')) {
                    const content = await blob.text();
                    if (controller.signal.aborted) return;
                    setText(content);
                }
                objectUrl = URL.createObjectURL(blob);
                setSource(objectUrl);
            } catch (exception) {
                if (!controller.signal.aborted) setError(exception instanceof Error ? exception.message : 'The preview could not be loaded.');
            }
        }
        void load();
        return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [url]);
    if (error) return <div role="alert" className="m-auto max-w-sm p-6 text-center"><FileText className="mx-auto mb-3 size-9 text-neutral-400" aria-hidden="true" /><p className="text-sm leading-6 text-neutral-600">{error}</p></div>;
    if (!source) return <div role="status" className="m-auto flex items-center gap-2 p-6 text-sm text-neutral-500"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />Loading preview...</div>;
    if (mime.startsWith('image/')) return <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4"><img src={source} alt={name} className="max-h-full max-w-full object-contain" /></div>;
    if (mime.startsWith('text/plain')) return <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-sm leading-7 text-neutral-800">{text}</pre>;
    return <iframe src={source} title={`Preview of ${name}`} className="min-h-0 w-full flex-1 border-0 bg-white" />;
}

export function FilePreview({ url, name, children, className }: { url: string; name: string; children?: ReactNode; className?: string }) {
    const [open, setOpen] = useState(false);
    return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><a href={`${url}?preview=1`} onClick={(event) => { event.preventDefault(); setOpen(true); }} className={className || 'flex min-h-12 max-w-full items-center gap-2 rounded-lg border p-3 text-sm text-primary hover:bg-neutral-50'}>{children || <><Eye className="size-4 shrink-0" aria-hidden="true" /><span className="break-all">{name}</span></>}</a></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/55" /><Dialog.Content className="fixed inset-3 z-50 flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl outline-none sm:inset-6 lg:inset-x-[10%] lg:inset-y-8"><div className="flex shrink-0 items-center gap-3 border-b px-4 py-3"><Eye className="size-5 shrink-0 text-neutral-500" aria-hidden="true" /><div className="min-w-0 flex-1"><Dialog.Title className="truncate text-sm font-semibold">{name}</Dialog.Title><Dialog.Description className="mt-0.5 text-xs text-neutral-500">File preview</Dialog.Description></div><Dialog.Close aria-label="Close preview" className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-neutral-100 focus-visible:outline-2"><X className="size-5" aria-hidden="true" /></Dialog.Close></div>{open && <PreviewContent url={url} name={name} />}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
