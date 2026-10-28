import { defineConfig, devices } from '@playwright/test';
import { appEnv } from './tests/Browser/support/environment';

export default defineConfig({
    testDir: './tests/Browser',
    testMatch: '**/*.spec.ts',
    globalSetup: './tests/Browser/setup.ts',
    fullyParallel: false,
    workers: 1,
    timeout: 60000,
    use: { baseURL: appEnv.APP_URL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium' } }],
    webServer: {
        command: 'php artisan serve --host=127.0.0.1 --port=8010 --no-reload',
        url: `${appEnv.APP_URL}/up`, env: appEnv, reuseExistingServer: false, timeout: 30000,
    },
});
