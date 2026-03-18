import { test, expect } from '@playwright/test';

test('board resize on play page persists to game page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  // Navigate to play page
  await page.goto('/play');

  // Wait for the board to render
  const board = page.locator('cg-board').first();
  await expect(board).toBeVisible();

  // Get initial board size
  const initialBox = await board.boundingBox();
  expect(initialBox).not.toBeNull();
  const initialSize = initialBox!.width;

  // Drag the resize handle to make the board smaller
  const handle = page.getByTestId('board-resize-handle');
  await expect(handle).toBeVisible();
  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();

  const handleCenter = {
    x: handleBox!.x + handleBox!.width / 2,
    y: handleBox!.y + handleBox!.height / 2,
  };

  // Drag left by 100px to shrink
  await page.mouse.move(handleCenter.x, handleCenter.y);
  await page.mouse.down();
  await page.mouse.move(handleCenter.x - 100, handleCenter.y, { steps: 10 });
  await page.mouse.up();

  // Verify the board actually changed size
  const resizedBox = await board.boundingBox();
  expect(resizedBox).not.toBeNull();
  const resizedSize = resizedBox!.width;
  expect(resizedSize).toBeLessThan(initialSize);

  // Start a game with clive_bot
  const botRow = page.locator('li', { hasText: 'clive_bot' });
  await expect(botRow).toBeVisible({ timeout: 10_000 });
  await botRow.locator('button', { hasText: 'Play' }).click();

  // Wait for navigation to game page
  await page.waitForURL(/\/game\//, { timeout: 15_000 });

  // Wait for the game board to render
  const gameBoard = page.locator('cg-board').first();
  await expect(gameBoard).toBeVisible();

  // Verify game board matches the resized size
  const gameBoardBox = await gameBoard.boundingBox();
  expect(gameBoardBox).not.toBeNull();
  expect(Math.abs(gameBoardBox!.width - resizedSize)).toBeLessThanOrEqual(1);

  // Resize the viewport and verify the board does NOT change during active game
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.waitForTimeout(500);

  const afterResizeBox = await gameBoard.boundingBox();
  expect(afterResizeBox).not.toBeNull();
  expect(Math.abs(afterResizeBox!.width - resizedSize)).toBeLessThanOrEqual(1);
});
