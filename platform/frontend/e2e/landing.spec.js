import { expect, test } from '@playwright/test';

test.describe('F1 landing page', () => {
  test('renders headline, wordmark, beta pill, and auth navigation', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'JSON in. Full-stack app out.' })).toBeVisible();
    await expect(page.getByText('BRAHM')).toBeVisible();
    await expect(page.getByText('beta')).toBeVisible();

    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/auth$/);

    await page.goto('/');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/auth$/);

    expect(consoleErrors).toEqual([]);
  });
});
