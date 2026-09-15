import { expect, test } from '@playwright/test';

test('loads the app and renders characters from the API', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Kanban', level: 1 })).toBeVisible();

  // Proves the real GraphQL request resolved and rendered, not just that the
  // bundle booted. Rick is the first result on page 1 of the characters query.
  await expect(page.getByText('Rick Sanchez').first()).toBeVisible();
});
