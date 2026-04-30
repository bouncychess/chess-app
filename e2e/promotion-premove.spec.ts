import { test, expect, Page } from '@playwright/test';
import { MOCK_WEBSOCKET_INIT_SCRIPT } from './helpers/mockWebSocket';

// Diagnostic test for the premove-promotion picker. Mocks the WebSocket so we
// can boot directly into a near-promotion game state with the opponent to
// move, then drives a premove and checks whether the picker renders.

const GAME_ID = 'test-game-1';

// White pawn on e7, black king a8, white king h1, black to move. Pawn is free
// to promote to e8.
const NEAR_PROMOTION_PGN = `[SetUp "1"]
[FEN "k7/4P3/8/8/8/8/8/7K b - - 0 1"]

*`;

const gameStateMessage = {
  action: 'gameState',
  gameId: GAME_ID,
  playerColor: 'white',
  currentTurn: 'black',
  whiteTime: 60_000,
  blackTime: 60_000,
  whiteUsername: 'me',
  blackUsername: 'opp',
  whiteRating: null,
  blackRating: null,
  increment: 0,
  initialTime: 60_000,
  pgn: NEAR_PROMOTION_PGN,
  chat: [],
};

async function bootGame(page: Page) {
  const consoleLogs: string[] = [];
  page.on('console', (m) => consoleLogs.push(`[${m.type()}] ${m.text()}`));

  await page.addInitScript(MOCK_WEBSOCKET_INIT_SCRIPT);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/game/${GAME_ID}`);

  // Wait for the mock socket to be open (the app has called `new WebSocket`).
  await page.waitForFunction(() => (window as any).__waitForSocket !== undefined);
  await page.evaluate(() => (window as any).__waitForSocket());

  // Deliver the auth-style "connected" handshake the WebSocketContext expects.
  await page.evaluate(() => (window as any).__deliver({ action: 'connected', username: 'me' }));

  // Deliver the game state that puts us in a near-promotion position with
  // black to move. This switches Game.tsx's status to "playing" and pushes
  // the PGN into the Board component.
  await page.evaluate((msg) => (window as any).__deliver(msg), gameStateMessage);

  return consoleLogs;
}

async function squareCenter(page: Page, file: string, rank: number, playerWhitePov = true) {
  const board = page.locator('cg-board').first();
  await expect(board).toBeVisible();
  const box = await board.boundingBox();
  if (!box) throw new Error('cg-board has no bounding box');
  const sq = box.width / 8;

  // file a..h -> 0..7, rank 1..8 -> bottom..top
  const fileIdx = file.charCodeAt(0) - 'a'.charCodeAt(0);
  const col = playerWhitePov ? fileIdx : 7 - fileIdx;
  const row = playerWhitePov ? 8 - rank : rank - 1;

  return {
    x: box.x + (col + 0.5) * sq,
    y: box.y + (row + 0.5) * sq,
  };
}

async function dragSquare(page: Page, from: string, to: string) {
  const fromCenter = await squareCenter(page, from[0], Number(from[1]));
  const toCenter = await squareCenter(page, to[0], Number(to[1]));
  await page.mouse.move(fromCenter.x, fromCenter.y);
  await page.mouse.down();
  await page.mouse.move(toCenter.x, toCenter.y, { steps: 8 });
  await page.mouse.up();
}

// Returns the piece DOM class string at the given square (e.g. "white knight"),
// or null if no piece is rendered there. Reads chessground's `cgKey` property
// that it sets on each <piece> element.
async function pieceAt(page: Page, square: string): Promise<string | null> {
  return page.evaluate((sq) => {
    const pieces = document.querySelectorAll('cg-board piece');
    for (const p of pieces as unknown as Iterable<HTMLElement>) {
      if ((p as unknown as { cgKey?: string }).cgKey === sq) return p.className;
    }
    return null;
  }, square);
}

test('premove that promotes shows the promotion picker', async ({ page }) => {
  await bootGame(page);

  await expect(page.locator('cg-board')).toBeVisible();

  // Drag the e7 white pawn to e8 to queue a promotion premove (it is black's
  // turn, so this should be a premove, not a real move).
  await dragSquare(page, 'e7', 'e8');

  // Primary assertion: the picker should be visible.
  await expect(page.getByTestId('promotion-picker')).toBeVisible();

  // Click the rook option and verify it closes.
  await page.getByTestId('promotion-piece-r').click();
  await expect(page.getByTestId('promotion-picker')).not.toBeVisible();
});

test('promoted piece can be used in a subsequent premove', async ({ page }) => {
  // White pawn on e6, black to move. We will: premove e6→e7, premove e7→e8
  // (promote to knight), premove e8→f6 (knight move). The third premove must
  // be accepted, and the visual board must show a white knight on f6.
  const SETUP_PGN = `[SetUp "1"]\n[FEN "k7/8/4P3/8/8/8/8/7K b - - 0 1"]\n\n*`;

  await page.addInitScript(MOCK_WEBSOCKET_INIT_SCRIPT);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/game/${GAME_ID}`);
  await page.waitForFunction(() => (window as any).__waitForSocket !== undefined);
  await page.evaluate(() => (window as any).__waitForSocket());
  await page.evaluate(() => (window as any).__deliver({ action: 'connected', username: 'me' }));
  await page.evaluate((msg) => (window as any).__deliver(msg), { ...gameStateMessage, pgn: SETUP_PGN });
  await expect(page.locator('cg-board')).toBeVisible();

  // Premove 1.
  await dragSquare(page, 'e6', 'e7');
  // Premove 2 — picker for promotion.
  await dragSquare(page, 'e7', 'e8');
  await expect(page.getByTestId('promotion-picker')).toBeVisible();
  await page.getByTestId('promotion-piece-n').click();
  await expect(page.getByTestId('promotion-picker')).not.toBeVisible();

  // After the visual swap, a white knight should be sitting on e8.
  await expect.poll(() => pieceAt(page, 'e8')).toMatch(/white\s+knight/);

  // Premove 3 — knight from e8 to f6. Without the visual swap working, the
  // square would still hold a pawn (which has no premove dests from e8) and
  // chessground would reject this drag.
  await dragSquare(page, 'e8', 'f6');

  // Verify the knight made it to f6 and is no longer on e8.
  await expect.poll(() => pieceAt(page, 'f6')).toMatch(/white\s+knight/);
  await expect.poll(() => pieceAt(page, 'e8')).toBeNull();
});

test('auto-promote-to-queen setting skips picker on a live move and queens', async ({ page }) => {
  // Same near-promotion position, but white to move so the drag is a real
  // move, not a premove. Both the PGN's FEN side-to-move and the gameState's
  // currentTurn must agree, otherwise chess.js rejects the move.
  const WHITE_TO_MOVE_PGN = `[SetUp "1"]\n[FEN "k7/4P3/8/8/8/8/8/7K w - - 0 1"]\n\n*`;
  await page.addInitScript(() => localStorage.setItem('auto_promote_to_queen', 'true'));
  await page.addInitScript(MOCK_WEBSOCKET_INIT_SCRIPT);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/game/${GAME_ID}`);
  await page.waitForFunction(() => (window as any).__waitForSocket !== undefined);
  await page.evaluate(() => (window as any).__waitForSocket());
  await page.evaluate(() => (window as any).__deliver({ action: 'connected', username: 'me' }));
  await page.evaluate((msg) => (window as any).__deliver(msg), { ...gameStateMessage, currentTurn: 'white', pgn: WHITE_TO_MOVE_PGN });
  await expect(page.locator('cg-board')).toBeVisible();

  // Make the promotion move directly. With auto-queen on, no picker should
  // appear and the pawn should become a queen on e8.
  await dragSquare(page, 'e7', 'e8');

  await expect(page.getByTestId('promotion-picker')).not.toBeVisible();
  await expect.poll(() => pieceAt(page, 'e8')).toMatch(/white\s+queen/);

  // Verify the move was sent over the (mock) socket with the queen suffix.
  const sent = await page.evaluate(() => (window as any).__sentMessages);
  const moves = sent.filter((m: any) => m.action === 'move');
  expect(moves.at(-1)).toMatchObject({ action: 'move', move: 'e7e8q' });
});

test('auto-promote-to-queen setting skips picker on a premove and queens visually', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('auto_promote_to_queen', 'true'));
  await bootGame(page); // black to move → drag is a premove
  await expect(page.locator('cg-board')).toBeVisible();

  // Premove the promotion. With auto-queen on, no picker; the visual on e8
  // should immediately become a white queen so follow-up premoves work.
  await dragSquare(page, 'e7', 'e8');

  await expect(page.getByTestId('promotion-picker')).not.toBeVisible();
  await expect.poll(() => pieceAt(page, 'e8')).toMatch(/white\s+queen/);

  // Premoves don't send a "move" message until the opponent replies, so we
  // shouldn't see one in the sent log yet.
  const sent = await page.evaluate(() => (window as any).__sentMessages);
  const moves = sent.filter((m: any) => m.action === 'move');
  expect(moves).toHaveLength(0);
});

test('auto-promote-to-queen setting allows follow-up premoves with the queened piece', async ({ page }) => {
  // Pawn on e6 so the chain is: e6→e7 (non-promotion premove), e7→e8
  // (auto-queens, no picker), e8→e1 (queen slides down the file). Without
  // the visual swap to a queen, chessground's premove validation would
  // reject the third drag because pawns can't move e8→e1.
  const SETUP_PGN = `[SetUp "1"]\n[FEN "k7/8/4P3/8/8/8/8/7K b - - 0 1"]\n\n*`;

  await page.addInitScript(() => localStorage.setItem('auto_promote_to_queen', 'true'));
  await page.addInitScript(MOCK_WEBSOCKET_INIT_SCRIPT);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/game/${GAME_ID}`);
  await page.waitForFunction(() => (window as any).__waitForSocket !== undefined);
  await page.evaluate(() => (window as any).__waitForSocket());
  await page.evaluate(() => (window as any).__deliver({ action: 'connected', username: 'me' }));
  await page.evaluate((msg) => (window as any).__deliver(msg), { ...gameStateMessage, pgn: SETUP_PGN });
  await expect(page.locator('cg-board')).toBeVisible();

  // Premove 1.
  await dragSquare(page, 'e6', 'e7');
  // Premove 2 — auto-queens silently.
  await dragSquare(page, 'e7', 'e8');
  await expect(page.getByTestId('promotion-picker')).not.toBeVisible();
  await expect.poll(() => pieceAt(page, 'e8')).toMatch(/white\s+queen/);

  // Premove 3 — queen slides from e8 to e1. Only legal because the visual
  // piece on e8 was swapped to a queen.
  await dragSquare(page, 'e8', 'e1');

  await expect.poll(() => pieceAt(page, 'e1')).toMatch(/white\s+queen/);
  await expect.poll(() => pieceAt(page, 'e8')).toBeNull();

  // No moves sent yet — all three are still in the premove queue.
  const sent = await page.evaluate(() => (window as any).__sentMessages);
  expect(sent.filter((m: any) => m.action === 'move')).toHaveLength(0);
});

test('chained premoves with promotion further down the chain show the picker', async ({ page }) => {
  // Override the boot position: pawn on e6 so we need two queued premoves
  // (e6→e7, then e7→e8) to reach promotion.
  const CHAINED_PGN = `[SetUp "1"]\n[FEN "k7/8/4P3/8/8/8/8/7K b - - 0 1"]\n\n*`;
  const consoleLogs: string[] = [];
  page.on('console', (m) => consoleLogs.push(`[${m.type()}] ${m.text()}`));

  await page.addInitScript(MOCK_WEBSOCKET_INIT_SCRIPT);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/game/${GAME_ID}`);
  await page.waitForFunction(() => (window as any).__waitForSocket !== undefined);
  await page.evaluate(() => (window as any).__waitForSocket());
  await page.evaluate(() => (window as any).__deliver({ action: 'connected', username: 'me' }));
  await page.evaluate((msg) => (window as any).__deliver(msg), { ...gameStateMessage, pgn: CHAINED_PGN });

  await expect(page.locator('cg-board')).toBeVisible();

  // Premove 1: e6 → e7 (non-promotion).
  await dragSquare(page, 'e6', 'e7');
  // Picker should NOT show for this premove.
  await expect(page.getByTestId('promotion-picker')).not.toBeVisible();

  // Premove 2: e7 → e8 (promotion via chained premove). chessground has
  // visually moved the pawn to e7; we drag from e7 to e8.
  await dragSquare(page, 'e7', 'e8');

  // The picker should appear now even though chess.js still has the pawn on e6.
  await expect(page.getByTestId('promotion-picker')).toBeVisible({ timeout: 2_000 });

  await page.getByTestId('promotion-piece-r').click();
  await expect(page.getByTestId('promotion-picker')).not.toBeVisible();
});
