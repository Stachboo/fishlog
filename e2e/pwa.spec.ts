import { test, expect } from '@playwright/test';

test('/manifest.json returns valid JSON with name containing FishLog', async ({ request }) => {
  const response = await request.get('/manifest.json');
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.name).toMatch(/FishLog/i);
});
