import { expect, test, type Page } from '@playwright/test';
import { demoPassword } from './support/environment';

async function signIn(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(demoPassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'My classrooms', exact: true })).toBeVisible();
}

test('teacher posts work, student turns it in, and the teacher returns a private grade', async ({ browser }, testInfo) => {
    const teacherContext = await browser.newContext();
    const studentContext = await browser.newContext();
    const teacher = await teacherContext.newPage();
    const student = await studentContext.newPage();

    await signIn(teacher, 'teacher@classwork.test');
    await teacher.getByText('Create a classroom', { exact: true }).click();
    await teacher.getByLabel('Class name', { exact: true }).fill('Workflow lab');
    await teacher.getByLabel('Section (optional)').fill('Browser verification');
    await teacher.getByRole('button', { name: 'Create classroom', exact: true }).click();
    await expect(teacher.getByRole('heading', { name: 'Workflow lab', exact: true })).toBeVisible();
    const inviteCode = await teacher.locator('code').innerText();

    await signIn(student, 'student@classwork.test');
    await student.getByLabel('Class code', { exact: true }).fill(inviteCode);
    await student.getByRole('button', { name: 'Join class', exact: true }).click();
    await expect(student.getByRole('heading', { name: 'Workflow lab', exact: true })).toBeVisible();

    await teacher.getByText('Post an assignment', { exact: true }).click();
    await teacher.getByLabel('Title', { exact: true }).fill('Design a safe submission workflow');
    await teacher.getByLabel('Instructions (optional)').fill('Explain how draft locking protects submitted work.');
    await teacher.getByLabel('Points', { exact: true }).fill('100');
    await teacher.getByRole('button', { name: 'Post assignment', exact: true }).click();
    await expect(teacher.getByRole('heading', { name: 'Design a safe submission workflow', exact: true })).toBeVisible();
    const assignmentUrl = teacher.url();

    await student.goto(assignmentUrl);
    await student.getByRole('button', { name: 'Start your work', exact: true }).click();
    await student.getByLabel('Attach or replace your file').setInputFiles({
        name: 'workflow.txt', mimeType: 'text/plain', buffer: Buffer.from('Drafts can change. Submitted work is immutable.'),
    });
    await student.getByRole('button', { name: 'Save draft file', exact: true }).click();
    await expect(student.getByRole('link', { name: 'workflow.txt', exact: true })).toBeVisible();
    await student.getByRole('button', { name: 'Turn in', exact: true }).click();
    await expect(student.getByText('Your work is locked.', { exact: false })).toBeVisible();
    await expect(student.getByLabel('Attach or replace your file')).toHaveCount(0);

    await teacher.reload();
    await teacher.getByLabel('Grade (out of 100)').fill('87.50');
    await teacher.getByLabel('Feedback (optional)').fill('Private feedback: clear locking explanation.');
    await teacher.getByRole('button', { name: 'Save grade', exact: true }).click();
    await expect(teacher.getByRole('button', { name: 'Return grade', exact: true })).toBeEnabled();

    await student.reload();
    await expect(student.getByText('Awaiting return', { exact: true })).toBeVisible();
    await expect(student.getByText('Private feedback: clear locking explanation.', { exact: true })).toHaveCount(0);

    await teacher.getByRole('button', { name: 'Return grade', exact: true }).click();
    await expect(teacher.getByText('Grade and feedback returned to the student.', { exact: true })).toBeVisible();
    await student.reload();
    await expect(student.getByText('Private feedback: clear locking explanation.', { exact: true })).toBeVisible();
    await expect(student.getByText('Returned', { exact: true })).toBeVisible();
    await expect(student.getByLabel('Attach or replace your file')).toHaveCount(0);

    await student.screenshot({ path: testInfo.outputPath('returned-grade-desktop.png'), fullPage: true });
    const downloadEvent = student.waitForEvent('download');
    await student.getByRole('link', { name: 'workflow.txt', exact: true }).click();
    expect((await downloadEvent).suggestedFilename()).toBe('workflow.txt');
    await teacherContext.close();
    await studentContext.close();
});

test('student classroom list fits a mobile viewport', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, 'student@classwork.test');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('classrooms-mobile.png'), fullPage: true });
});
