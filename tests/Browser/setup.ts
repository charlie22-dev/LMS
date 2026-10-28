import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { appEnv, databasePath } from './support/environment';

export default function setup() {
    mkdirSync(dirname(databasePath), { recursive: true });
    // Only the dedicated browser-test database is reset; the application DB is never used.
    writeFileSync(databasePath, '');
    const options = { env: { ...process.env, ...appEnv }, stdio: 'pipe' as const };
    execFileSync('php', ['artisan', 'migrate', '--force', '--no-interaction'], options);
    execFileSync('php', ['artisan', 'db:seed', '--class=LmsDemoSeeder', '--force', '--no-interaction'], options);
}
