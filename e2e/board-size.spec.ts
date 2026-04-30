import { test, expect } from '@playwright/test';
import { MOCK_WEBSOCKET_INIT_SCRIPT } from './helpers/mockWebSocket';

const GAME_ID = 'test-game-size';

const gameStateMessage = {
  action: 'gameState',
  gameId: GAME_ID,
  playerColor: 'white',
  currentTurn: 'white',
  whiteTime: 60_000,
  blackTime: 60_000,
  whiteUsername: 'me',
  blackUsername: 'opp',
  whiteRating: null,
  blackRating: null,
  increment: 0,
  initialTime: 60_000,
  pgn: '',
  chat: [],
};

test('board resize on play page persists to game page', async ({ page }) => {
  await page.addInitScript(MOCK_WEBSOCKET_INIT_SCRIPT);
  await page.setViewportSize({ width: 1280, height: 720 });

  // Resize the board on the /play preview.
  await page.goto('/play');
  await page.waitForFunction(() => (window as any).__waitForSocket !== undefined);
  await page.evaluate(() => (window as any).__waitForSocket());
  await page.evaluate(() => (window as any).__deliver({ action: 'connected', username: 'me' }));

  const board = page.locator('cg-board').first();
  await expect(board).toBeVisible();
  const initialBox = await board.boundingBox();
  expect(initialBox).not.toBeNull();
  const initialSize = initialBox!.width;

  const handle = page.getByTestId('board-resize-handle');
  await expect(handle).toBeVisible();
  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();
  const handleCenter = {
    x: handleBox!.x + handleBox!.width / 2,
    y: handleBox!.y + handleBox!.height / 2,
  };

  // Drag left by 100px to shrink.
  await page.mouse.move(handleCenter.x, handleCenter.y);
  await page.mouse.down();
  await page.mouse.move(handleCenter.x - 100, handleCenter.y, { steps: 10 });
  await page.mouse.up();

  const resizedBox = await board.boundingBox();
  expect(resizedBox).not.toBeNull();
  const resizedSize = resizedBox!.width;
  expect(resizedSize).toBeLessThan(initialSize);

  // Navigate directly to a mocked game page (no backend needed) and verify
  // the saved board size is restored.
  await page.goto(`/game/${GAME_ID}`);
  await page.waitForFunction(() => (window as any).__waitForSocket !== undefined);
  await page.evaluate(() => (window as any).__waitForSocket());
  await page.evaluate(() => (window as any).__deliver({ action: 'connected', username: 'me' }));
  await page.evaluate((msg) => (window as any).__deliver(msg), gameStateMessage);

  const gameBoard = page.locator('cg-board').first();
  await expect(gameBoard).toBeVisible();
  const gameBoardBox = await gameBoard.boundingBox();
  expect(gameBoardBox).not.toBeNull();
  expect(Math.abs(gameBoardBox!.width - resizedSize)).toBeLessThanOrEqual(1);

  // Resize the viewport and verify the board does NOT change during active game.
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.waitForTimeout(500);

  const afterResizeBox = await gameBoard.boundingBox();
  expect(afterResizeBox).not.toBeNull();
  expect(Math.abs(afterResizeBox!.width - resizedSize)).toBeLessThanOrEqual(1);
});
