import { test, expect } from '@playwright/test';

test('unauthenticated user visiting /spots gets redirected to login', async ({ page }) => {
  await page.goto('/spots');
  await expect(page).toHaveURL(/login/);
});
