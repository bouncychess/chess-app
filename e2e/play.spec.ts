import { test, expect } from '@playwright/test';

test('play page loads with board and player list', async ({ page }) => {
  await page.goto('/play');

  // Board should render
  await expect(page.locator('cg-board')).toBeVisible();

  // Online Players heading should be present
  await expect(page.getByText('Online Players')).toBeVisible();
});
