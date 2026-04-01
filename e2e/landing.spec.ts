import { test, expect } from '@playwright/test';

test('landing page loads and has title containing FishLog', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/FishLog/i);
});
