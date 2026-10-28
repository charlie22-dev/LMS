import '../css/app.css';
import '@fontsource-variable/inter';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

void createInertiaApp({
    title: (title) => `${title} · Classwork`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        createRoot(el).render(<MotionConfig reducedMotion="user"><App {...props} /><Toaster richColors position="top-right" /></MotionConfig>);
    },
    progress: { color: '#4f46e5' },
});
