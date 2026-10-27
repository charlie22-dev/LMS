import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let instance: Echo<'reverb'> | null = null;

export function getEcho(): Echo<'reverb'> | null {
    const key = import.meta.env.VITE_REVERB_APP_KEY;
    if (!key) return null;
    if (!instance) {
        const tls = (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https';
        const port = Number(import.meta.env.VITE_REVERB_PORT ?? (tls ? 443 : 80));
        const options = {
            key,
            wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
            wsPort: port,
            wssPort: port,
            forceTLS: tls,
            enabledTransports: ['ws', 'wss'] as ('ws' | 'wss')[],
            cluster: '',
        };
        instance = new Echo({ broadcaster: 'reverb', ...options, client: new Pusher(key, options) });
    }
    return instance;
}
