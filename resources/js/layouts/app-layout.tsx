import { Link, router, usePage } from '@inertiajs/react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BookOpen, CalendarDays, CheckSquare, ChevronDown, GraduationCap, HelpCircle, LayoutDashboard, LogOut, Menu, Settings, UserRound, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { SharedProps } from '@/types/portal';
import { cn } from '@/lib/utils';

const links = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, active: 'dashboard' },
    { label: 'My classrooms', href: '/', icon: BookOpen, active: 'courses' },
    { label: 'Calendar', href: '/calendar', icon: CalendarDays, active: 'calendar' },
    { label: 'To-do', href: '/todo', icon: CheckSquare, active: 'todo' },
    { label: 'My profile', href: '/portal/profile', icon: UserRound, active: 'profile' },
];

function Sidebar({ active, onNavigate }: { active: string; onNavigate?: () => void }) {
    return <div className="flex h-full min-h-0 flex-col rounded-[20px] bg-[#191919] p-3 text-white">
        <Link href="/" onClick={onNavigate} className="mb-10 flex min-h-12 items-center gap-2.5 rounded-xl px-3 text-xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b5b5b5]"><span className="flex size-8 items-center justify-center rounded-lg border border-white/35"><GraduationCap className="size-5" aria-hidden="true" /></span>classwork<span className="text-[#b5b5b5]">.</span></Link>
        <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">Your workspace</p>
        <nav aria-label="Main navigation" className="space-y-1">{links.map(({ label, href, icon: Icon, active: key }) => <Link key={href} href={href} onClick={onNavigate} aria-current={active === key ? 'page' : undefined} className={cn('flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] text-white/70 outline-none transition-colors hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-[#b5b5b5]', active === key && 'bg-white/10 font-medium text-white')}><Icon className="size-[17px] shrink-0" aria-hidden="true" />{label}{active === key && <span aria-hidden="true" className="ml-auto size-1.5 rounded-full bg-[#b5b5b5]" />}</Link>)}</nav>
        <div className="mt-auto border-t border-white/10 pt-4"><p className="px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">Account</p><Link href="/portal/profile" onClick={onNavigate} className="mt-2 flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] text-white/65 hover:bg-white/8 hover:text-white"><Settings className="size-[17px]" aria-hidden="true" />Account settings</Link><Link href="/" onClick={onNavigate} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] text-white/65 hover:bg-white/8 hover:text-white"><HelpCircle className="size-[17px]" aria-hidden="true" />Your classrooms</Link></div>
    </div>;
}

export function AppLayout({ title, active, children }: { title: string; active: string; children: ReactNode }) {
    const { auth } = usePage<SharedProps>().props;
    const [open, setOpen] = useState(false);
    const reduced = useReducedMotion();
    const initials = auth.user.name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    return <div className="min-h-dvh bg-[#fbfbfb] text-[#1d1d1d]">
        <a href="#main-content" className="sr-only z-[100] bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
        <div className="min-h-dvh w-full bg-[#fbfbfb] lg:flex">
            <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 p-3 lg:block"><Sidebar active={active} /></aside>
            <div className="min-w-0 flex-1">
                <header className="sticky top-0 z-30 border-b border-[#eeeeee] bg-[#fbfbfb]/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:static lg:pt-0"><div className="flex h-[72px] items-center gap-3 px-4 sm:px-7 lg:px-8">
                    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger aria-label="Open navigation" className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[#4c4c4c] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#727272] lg:hidden"><Menu className="size-5" /></Dialog.Trigger><Dialog.Portal forceMount><AnimatePresence>{open && <><Dialog.Overlay forceMount asChild><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.15 }} className="fixed inset-0 z-40 bg-black/45" /></Dialog.Overlay><Dialog.Content forceMount asChild><motion.aside initial={{ transform: reduced ? 'translateX(0)' : 'translateX(-100%)' }} animate={{ transform: 'translateX(0)' }} exit={{ transform: reduced ? 'translateX(0)' : 'translateX(-100%)' }} transition={{ duration: reduced ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] }} className="fixed inset-y-0 left-0 z-50 w-[min(300px,85vw)] p-3 outline-none"><Dialog.Title className="sr-only">Navigation</Dialog.Title><Dialog.Description className="sr-only">Navigate your classes and learning activity.</Dialog.Description><Dialog.Close aria-label="Close navigation" className="absolute right-6 top-6 z-10 flex size-10 items-center justify-center rounded-full text-white/75 hover:bg-white/10"><X className="size-5" /></Dialog.Close><Sidebar active={active} onNavigate={() => setOpen(false)} /></motion.aside></Dialog.Content></>}</AnimatePresence></Dialog.Portal></Dialog.Root>
                    <Link href="/" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#191919] text-white lg:hidden" aria-label="Classwork home"><GraduationCap className="size-5" /></Link>
                    <div className="hidden items-center gap-3 text-sm sm:flex"><Link href="/" className="text-neutral-500 hover:text-neutral-950">Workspace</Link><span aria-hidden="true" className="text-neutral-300">/</span><span className="font-medium text-neutral-900">{title}</span></div>
                    <span className="min-w-0 truncate text-sm font-medium text-[#696969] sm:hidden">{title}</span>
                    <div className="ml-auto"><Dropdown.Root><Dropdown.Trigger aria-label="Account menu" className="flex min-h-11 items-center gap-2 rounded-xl p-1 focus-visible:outline-2 focus-visible:outline-[#727272]"><span className="flex size-9 items-center justify-center rounded-xl bg-[#dadada] text-xs font-semibold text-[#484848]">{initials}</span><ChevronDown className="hidden size-3.5 text-[#848484] sm:block" /></Dropdown.Trigger><Dropdown.Portal><Dropdown.Content align="end" sideOffset={8} className="z-50 min-w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-[#e8e8e8] bg-white p-2 shadow-[0_12px_30px_rgba(32,32,32,0.14)]"><Dropdown.Label className="px-3 py-2"><span className="block break-words text-sm font-medium text-[#222222]">{auth.user.name}</span><span className="block break-all text-xs font-normal text-[#777777]">{auth.user.email}</span></Dropdown.Label><Dropdown.Separator className="my-1 h-px bg-[#eeeeee]" /><Dropdown.Item asChild><Link href="/portal/profile" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm outline-none data-[highlighted]:bg-[#f3f3f3]"><UserRound className="size-4" />Account settings</Link></Dropdown.Item><Dropdown.Item onSelect={() => router.post('/logout')} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm outline-none data-[highlighted]:bg-[#f3f3f3]"><LogOut className="size-4" />Sign out</Dropdown.Item></Dropdown.Content></Dropdown.Portal></Dropdown.Root></div>
                </div></header>
                <main id="main-content" className="w-full px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-7 sm:pt-6 lg:px-10 lg:pb-10 xl:px-12">{children}</main>
            </div>
        </div>
        <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[#eaeaea] bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">{links.filter((item) => item.active !== 'dashboard').map(({ label, href, icon: Icon, active: key }) => <Link key={href} href={href} aria-current={active === key ? 'page' : undefined} className={cn('flex min-h-[64px] min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] text-[#7d7d7d]', active === key && 'font-medium text-[#616161]')}><span className={cn('flex h-7 w-16 items-center justify-center rounded-full', active === key && 'bg-[#eaeaea]')}><Icon className="size-5" aria-hidden="true" /></span>{label === 'My classrooms' ? 'Home' : label === 'My profile' ? 'Profile' : label}</Link>)}</nav>
    </div>;
}
