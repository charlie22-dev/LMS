import { expect, test } from '@playwright/test';
import { demoPassword } from './support/environment';

test('enrolled subjects filter to-do work on desktop and in the phone drawer', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill('student@classwork.test');
    await page.getByLabel('Password', { exact: true }).fill(demoPassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    const subjects = page.getByRole('list', { name: 'Subject to-do lists' });
    await subjects.getByRole('link', { name: /Software Architecture/ }).click();
    await expect(page).toHaveURL(/\/todo\?classroom=\d+$/);
    await expect(page.getByLabel('Subject', { exact: true }).locator('option:checked')).toHaveText('Software Architecture');
    await expect(subjects.getByRole('link', { name: /Software Architecture/ })).toHaveAttribute('aria-current', 'page');
    await page.getByLabel('Subject', { exact: true }).selectOption('');
    await expect(page).toHaveURL(/\/todo$/);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByRole('list', { name: 'Subject to-do lists' }).getByRole('link', { name: /Software Architecture/ }).click();
    await expect(drawer).toBeHidden();
    await expect(page).toHaveURL(/\/todo\?classroom=\d+$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
