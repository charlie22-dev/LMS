import { expect, test, type Page } from '@playwright/test';
import { demoPassword } from './support/environment';

async function login(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(demoPassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'My classrooms' })).toBeVisible();
}

test('teacher shares materials and announcements and student uploads work directly', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const studentContext = await browser.newContext({ viewport: { width: 320, height: 700 } });
    const teacher = await teacherContext.newPage();
    const student = await studentContext.newPage();
    await login(teacher, 'teacher@classwork.test');
    await teacher.locator('article').filter({ has: teacher.getByRole('heading', { name: 'Software Architecture', exact: true }) }).getByRole('link', { name: 'Open classroom' }).click();
    await expect(teacher.getByRole('heading', { name: 'Software Architecture', exact: true })).toBeVisible();
    await expect(teacher).toHaveURL(/\/classrooms\/\d+\/stream$/);
    const downloads: string[] = [];
    student.on('download', (download) => downloads.push(download.suggestedFilename()));
    const streamUrl = teacher.url();
    await login(student, 'student@classwork.test');
    for (const [label, type] of [['Materials', 'material'], ['Announcement', 'announcement']]) {
        await teacher.goto(streamUrl);
        await teacher.getByText('Create a post', { exact: true }).click();
        await teacher.getByRole('radio', { name: label, exact: true }).check();
        await teacher.getByLabel('Title', { exact: true }).fill(`Shared ${type}`);
        await expect(teacher.getByLabel('Points', { exact: true })).toBeHidden();
        await teacher.getByLabel('Attachments (optional)').setInputFiles([
            { name: 'lesson.txt', mimeType: 'text/plain', buffer: Buffer.from('Lesson content') },
            { name: 'reading.txt', mimeType: 'text/plain', buffer: Buffer.from('Reading content') },
        ]);
        await teacher.getByRole('button', { name: `Post ${type}`, exact: true }).click();
        await expect(teacher.getByRole('heading', { name: `Shared ${type}` })).toBeVisible();
        await student.goto(teacher.url());
        await student.goto(teacher.url());
        await student.getByRole('link', { name: /lesson.txt/ }).click();
        await expect(student.getByRole('dialog').getByText('Lesson content', { exact: true })).toBeVisible();
        await student.getByRole('button', { name: 'Close preview' }).click();
        await expect(student.getByRole('dialog')).toBeHidden();
        await expect(student.getByRole('heading', { name: 'Your work' })).toHaveCount(0);
        expect(await student.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await teacher.goto(streamUrl);
    await teacher.getByText('Create a post', { exact: true }).click();
    await teacher.getByLabel('Title', { exact: true }).fill('Direct upload homework');
    await teacher.getByRole('button', { name: 'Post assignment', exact: true }).click();
    await expect(teacher.getByRole('heading', { name: 'Direct upload homework' })).toBeVisible();
    await student.goto(teacher.url());
    await student.getByLabel('Add a class comment', { exact: true }).fill('Can we discuss the reading?');
    await student.getByRole('button', { name: 'Post class comment', exact: true }).click();
    await expect(student.getByText('Can we discuss the reading?', { exact: true })).toBeVisible();
    await student.getByLabel('Add a private comment', { exact: true }).fill('Private question for my teacher');
    await student.getByRole('button', { name: 'Send private comment', exact: true }).click();
    await expect(student.getByText('Private question for my teacher', { exact: true })).toBeVisible();
    await teacher.reload();
    await teacher.getByLabel('Private conversation with').selectOption({ label: 'Sam Reyes' });
    await expect(teacher.getByText('Private question for my teacher', { exact: true })).toBeVisible();
    await expect(teacher.getByText('Can we discuss the reading?', { exact: true })).toBeVisible();
    await teacher.getByLabel('Add a private comment', { exact: true }).fill('Private teacher reply');
    await teacher.getByRole('button', { name: 'Send private comment', exact: true }).click();
    await expect(teacher.getByText('Private teacher reply', { exact: true })).toBeVisible();
    await student.getByRole('button', { name: 'Refresh private comments', exact: true }).click();
    await expect(student.getByText('Private teacher reply', { exact: true })).toBeVisible();
    await student.getByLabel('Upload your work').setInputFiles({ name: 'my-work.txt', mimeType: 'text/plain', buffer: Buffer.from('Student answer') });
    await student.getByRole('button', { name: 'Upload work', exact: true }).click();
    await expect(student.getByRole('link', { name: 'my-work.txt' })).toBeVisible();
    await student.getByRole('link', { name: 'my-work.txt' }).click();
    await expect(student.getByRole('dialog').getByText('Student answer', { exact: true })).toBeVisible();
    await student.getByRole('button', { name: 'Close preview' }).click();
    expect(downloads).toEqual([]);
    await student.getByRole('button', { name: 'Turn in', exact: true }).click();
    await expect(student.getByText('Your work is locked.', { exact: false })).toBeVisible();
    expect(await student.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await teacherContext.close();
    await studentContext.close();
});
