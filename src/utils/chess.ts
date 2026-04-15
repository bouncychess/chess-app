import { Chess } from "chess.js";

/**
 * Computes the FEN position after playing N half-moves from a PGN string.
 * @param pgn - The full PGN string
 * @param moveIndex - The 0-based half-move index. null returns the final position.
 *                    -1 returns the starting position (before any moves).
 * @returns The FEN string at the specified position
 */
export function getFenAtMoveIndex(pgn: string, moveIndex: number | null): string {
  const chess = new Chess();

  if (!pgn) {
    return chess.fen();
  }

  try {
    chess.loadPgn(pgn);
  } catch {
    return chess.fen();
  }

  const moves = chess.history();

  if (moveIndex === null || moveIndex >= moves.length) {
    return chess.fen();
  }

  if (moveIndex < 0) {
    return new Chess().fen();
  }

  const replayChess = new Chess();
  for (let i = 0; i <= moveIndex && i < moves.length; i++) {
    replayChess.move(moves[i]);
  }

  return replayChess.fen();
}

/**
 * Returns a Chess instance replayed up to a given half-move index from a PGN.
 */
export function replayToIndex(pgn: string, moveIndex: number): Chess {
  if (!pgn || moveIndex < 0) return new Chess();
  const chess = new Chess();
  chess.loadPgn((pgn.match(new RegExp(`^.*?${Math.floor(moveIndex / 2) + 1}\\.\\s*\\S+${moveIndex % 2 === 1 ? "\\s+\\S+" : ""}`, "s")) || [""])[0]);
  return chess;
}

/**
 * Gets the total number of half-moves from a PGN string.
 */
export function getMoveCount(pgn: string): number {
  if (!pgn) return 0;

  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
    return chess.history().length;
  } catch {
    return 0;
  }
}
