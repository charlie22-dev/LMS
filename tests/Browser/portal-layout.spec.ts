import { expect, test } from '@playwright/test';
import { demoPassword } from './support/environment';

test('portal pages fit phone, tablet and desktop without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/login');
    await page.getByLabel('Email').fill('student@classwork.test');
    await page.getByLabel('Password').fill(demoPassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'My classrooms' })).toBeVisible();
    for (const width of [320, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 800 });
        for (const path of ['/', '/dashboard', '/calendar', '/todo', '/portal/profile']) {
            const response = await page.goto(path);
            expect(response?.status(), `${path} at ${width}px`).toBe(200);
            await expect(page.locator('h1')).toBeVisible();
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} overflows at ${width}px`).toBe(true);
        }
    }
    expect(errors).toEqual([]);
});
