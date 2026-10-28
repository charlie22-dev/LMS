import { expect, test } from '@playwright/test';
import { demoPassword } from './support/environment';

test('dashboard tabs, search, and mobile navigation work', async ({ page }, testInfo) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('student@classwork.test');
    await page.getByLabel('Password').fill(demoPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'My classrooms' })).toBeVisible();
    await page.goto('/dashboard');
    await expect(page.getByText('Sample data', { exact: true })).toBeVisible();
    await expect(page.getByText('Current CGPA')).toBeVisible();
    await page.getByRole('tab', { name: 'Completed' }).click();
    await expect(page.getByText('Foundations of Computing')).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.getByRole('textbox', { name: 'Search pages' }).fill('library');
    await expect(page.getByRole('dialog').getByRole('link', { name: 'Library' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.screenshot({ path: testInfo.outputPath('dashboard-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'More' }).click();
    await expect(page.getByRole('dialog').getByRole('link', { name: 'Finance' })).toBeVisible();
    await page.getByRole('button', { name: 'Close navigation' }).click();
    await page.screenshot({ path: testInfo.outputPath('dashboard-mobile.png'), fullPage: true });
});
