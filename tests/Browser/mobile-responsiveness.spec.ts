import { expect, test, type Page } from '@playwright/test';
import { demoPassword } from './support/environment';

async function signIn(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(demoPassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'My classrooms' })).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('student navigation and join dialog fit a short, narrow phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signIn(page, 'student@classwork.test');
    await expectNoHorizontalOverflow(page);
    await page.getByRole('button', { name: 'Join class', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Class code')).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(568);
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Calendar' }).click();
    await expect(page.getByRole('heading', { name: 'Calendar', exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'To-do' }).click();
    await expect(page.getByRole('heading', { name: 'To-do', exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
});

test('teacher can post and read a long-titled assignment on a narrow phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await signIn(page, 'teacher@classwork.test');
    await page.locator('article').filter({ has: page.getByRole('heading', { name: 'Software Architecture', exact: true }) }).getByRole('link', { name: 'Open classroom', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Software Architecture' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByText('Create a post', { exact: true }).click();
    const title = 'A detailed assignment about designing resilient and accessible classroom workflows';
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Instructions (optional)').fill('Explain how students can read and submit their work from a phone.');
    await page.getByRole('button', { name: 'Post assignment', exact: true }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByRole('link', { name: 'Software Architecture' }).click();
    await expect(page.getByRole('link', { name: title })).toBeVisible();
    await expectNoHorizontalOverflow(page);
});
