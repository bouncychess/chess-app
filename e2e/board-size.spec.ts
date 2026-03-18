import { test, expect } from '@playwright/test';

test('board size stays consistent from play page to game page', async ({ page }) => {
  // Use a fixed viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  // Navigate to play page
  await page.goto('/play');

  // Wait for the board to render
  const playBoard = page.locator('cg-board').first();
  await expect(playBoard).toBeVisible();

  // Get board size on play page
  const playBoardBox = await playBoard.boundingBox();
  expect(playBoardBox).not.toBeNull();
  const playBoardSize = playBoardBox!.width;

  // Find clive_bot and click Play
  const botRow = page.locator('li', { hasText: 'clive_bot' });
  await expect(botRow).toBeVisible({ timeout: 10_000 });
  const playButton = botRow.locator('button', { hasText: 'Play' });
  await playButton.click();

  // Wait for navigation to game page
  await page.waitForURL(/\/game\//, { timeout: 15_000 });

  // Wait for the game board to render
  const gameBoard = page.locator('cg-board').first();
  await expect(gameBoard).toBeVisible();

  // Get board size on game page
  const gameBoardBox = await gameBoard.boundingBox();
  expect(gameBoardBox).not.toBeNull();
  const gameBoardSize = gameBoardBox!.width;

  // Board sizes should match (within 1px tolerance for rounding)
  expect(Math.abs(gameBoardSize - playBoardSize)).toBeLessThanOrEqual(1);

  // Resize the viewport and verify the board does NOT change size
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.waitForTimeout(500); // give resize handler time to fire

  const afterResizeBox = await gameBoard.boundingBox();
  expect(afterResizeBox).not.toBeNull();
  expect(Math.abs(afterResizeBox!.width - gameBoardSize)).toBeLessThanOrEqual(1);

  // Also try a smaller viewport
  await page.setViewportSize({ width: 900, height: 600 });
  await page.waitForTimeout(500);

  const afterShrinkBox = await gameBoard.boundingBox();
  expect(afterShrinkBox).not.toBeNull();
  expect(Math.abs(afterShrinkBox!.width - gameBoardSize)).toBeLessThanOrEqual(1);
});
