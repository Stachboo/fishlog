import { test, expect } from '@playwright/test';

test('Arabic locale sets dir="rtl" on html element', async ({ page, context }) => {
  await context.addCookies([
    { name: 'NEXT_LOCALE', value: 'ar', domain: 'localhost', path: '/' },
  ]);
  await page.goto('/');
  const dir = await page.locator('html').getAttribute('dir');
  expect(dir).toBe('rtl');
});

test('French locale sets dir="ltr" on html element', async ({ page, context }) => {
  await context.addCookies([
    { name: 'NEXT_LOCALE', value: 'fr', domain: 'localhost', path: '/' },
  ]);
  await page.goto('/');
  const dir = await page.locator('html').getAttribute('dir');
  expect(dir).toBe('ltr');
});
