import { test, expect } from '@playwright/test';

test('dashboard page loads and contains FishLog or search component', async ({ page }) => {
  await page.goto('/');
  const body = page.locator('body');
  await expect(body).toContainText(/FishLog/i);
});
