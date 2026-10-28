import { resolve } from 'node:path';

export const databasePath = resolve('storage/framework/testing/browser-workflow.sqlite');
export const demoPassword = 'E2eOnly!Classwork123';

// This environment is restricted to the isolated browser-test server.
export const appEnv = {
    APP_ENV: 'testing', APP_DEBUG: 'false', APP_URL: 'http://127.0.0.1:8010',
    APP_KEY: `base64:${Buffer.alloc(32, 7).toString('base64')}`,
    APP_CONFIG_CACHE: resolve('storage/framework/testing/browser-config.php'),
    DB_CONNECTION: 'sqlite', DB_DATABASE: databasePath, DB_URL: '',
    SESSION_DRIVER: 'cookie', CACHE_STORE: 'array', QUEUE_CONNECTION: 'sync',
    BROADCAST_CONNECTION: 'null', MAIL_MAILER: 'array',
    PRIVATE_FILES_ROOT: resolve('storage/framework/testing/browser-files'),
    LMS_DEMO_PASSWORD: demoPassword,
};
