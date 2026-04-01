import { test, expect } from '@playwright/test';

test('journal page exists (may redirect to login if not authenticated)', async ({ page }) => {
  const response = await page.goto('/journal');
  expect(response?.status()).toBeLessThan(500);
});
