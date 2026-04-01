import { test, expect } from '@playwright/test';

test('GET /api/health returns status 200 and body contains status', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain('status');
});
