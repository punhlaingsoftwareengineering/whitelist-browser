import { test, expect } from '@playwright/test';

test('onboarding page renders', async ({ page }) => {
	await page.goto('/onboarding');
	await expect(page.getByRole('heading', { name: /Controlled browsing for your organization/i })).toBeVisible();
	await expect(page.getByRole('link', { name: /Get started/i })).toBeVisible();
});

