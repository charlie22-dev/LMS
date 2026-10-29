import { expect, test } from '@playwright/test';
import { demoPassword } from './support/environment';

test('classes preview and mobile navigation are accessible', async ({ page }, testInfo) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('student@classwork.test');
    await page.getByLabel('Password').fill(demoPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'My classrooms' })).toBeVisible();
    await page.getByRole('button', { name: 'Preview class cards' }).click();
    await expect(page.getByText('Preview: these four classes are examples.', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Introduction to Design' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Computer Science' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('classes-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('dialog').getByRole('link', { name: 'Calendar' })).toBeVisible();
    await page.getByRole('button', { name: 'Close navigation' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.screenshot({ path: testInfo.outputPath('classes-mobile.png'), fullPage: true });
});
