import { FilePreview } from '@/components/ui/file-preview';
import { Eye, Paperclip } from 'lucide-react';
import type { PostAttachment } from '@/types/classroom';

export function PostAttachments({ attachments }: { attachments: PostAttachment[] }) {
    if (!attachments.length) return null;
    return <div className="mt-4 space-y-2" aria-label="Post attachments">{attachments.map((attachment) => <FilePreview key={attachment.id} url={attachment.url} name={attachment.name} className="flex min-h-12 items-center gap-3 rounded-xl border bg-neutral-50 px-3 py-3 text-sm transition-colors hover:bg-neutral-100 focus-visible:outline-2"><Paperclip className="size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1 break-all">{attachment.name}<span className="mt-0.5 block text-xs text-neutral-500">{(attachment.size / 1024).toFixed(1)} KB</span></span><Eye className="size-4 shrink-0" aria-hidden="true" /></FilePreview>)}</div>;
}
