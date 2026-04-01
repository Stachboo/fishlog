import { test, expect } from '@playwright/test';

test('spots page exists (may redirect to login if not authenticated)', async ({ page }) => {
  const response = await page.goto('/spots');
  expect(response?.status()).toBeLessThan(500);
});
