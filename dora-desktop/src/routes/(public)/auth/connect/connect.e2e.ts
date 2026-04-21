import { test, expect } from '@playwright/test';

test('connect page renders', async ({ page }) => {
	await page.goto('/auth/connect');
	await expect(page.getByRole('heading', { name: /Connect to an organization/i })).toBeVisible();
});

