import { useCallback, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import type { PlayerColor } from "../types/chess";
import { replayToIndex } from "../utils/chess";

type PromotionPiece = "q" | "r" | "b" | "n";

export interface ExplorationMoveResult {
  fen: string;
  turn: PlayerColor;
  isCheck: boolean;
  pgn: string;
}

interface UseExplorationParams {
  chessGameRef: React.RefObject<Chess>;
  viewedMoveIndexRef: React.RefObject<number | null>;
  onExplorationChange?: (isExploring: boolean) => void;
  onExplorationPgnChange?: (pgn: string) => void;
}

export function useExploration({
  chessGameRef,
  viewedMoveIndexRef,
  onExplorationChange,
  onExplorationPgnChange,
}: UseExplorationParams) {
  const explorationChessRef = useRef<Chess | null>(null);
  const isExploringRef = useRef(false);
  const onExplorationChangeRef = useRef(onExplorationChange);
  const onExplorationPgnChangeRef = useRef(onExplorationPgnChange);

  useEffect(() => { onExplorationChangeRef.current = onExplorationChange; }, [onExplorationChange]);
  useEffect(() => { onExplorationPgnChangeRef.current = onExplorationPgnChange; }, [onExplorationPgnChange]);

  const executeExplorationMove = useCallback((from: string, to: string, promotion?: PromotionPiece): ExplorationMoveResult | null => {
    // Initialize exploration chess on first move — from history position or live position
    if (!explorationChessRef.current) {
      const livePgn = chessGameRef.current.pgn();
      const viewIdx = viewedMoveIndexRef.current;
      if (viewIdx !== null && viewIdx >= 0) {
        explorationChessRef.current = replayToIndex(livePgn, viewIdx);
      } else if (viewIdx === -1) {
        explorationChessRef.current = new Chess();
      } else {
        explorationChessRef.current = new Chess();
        explorationChessRef.current.loadPgn(livePgn);
      }
      isExploringRef.current = true;
      onExplorationChangeRef.current?.(true);
    } else {
      // Already exploring — check if scrolled back, and truncate to branch point
      const viewIdx = viewedMoveIndexRef.current;
      const totalMoves = explorationChessRef.current.history().length;
      if (viewIdx !== null && viewIdx >= 0 && viewIdx < totalMoves - 1) {
        explorationChessRef.current = replayToIndex(explorationChessRef.current.pgn(), viewIdx);
      } else if (viewIdx === -1) {
        explorationChessRef.current = new Chess();
      }
    }

    const explChess = explorationChessRef.current;
    try {
      const moveResult = explChess.move({ from, to, promotion: promotion || "q" });
      if (!moveResult) return null;
      const result: ExplorationMoveResult = {
        fen: explChess.fen(),
        turn: explChess.turn() === 'w' ? 'white' : 'black',
        isCheck: explChess.inCheck(),
        pgn: explChess.pgn(),
      };
      onExplorationPgnChangeRef.current?.(result.pgn);
      return result;
    } catch {
      return null;
    }
  }, [chessGameRef, viewedMoveIndexRef]);

  const resetExploration = useCallback(() => {
    explorationChessRef.current = null;
    isExploringRef.current = false;
  }, []);

  return {
    explorationChessRef,
    isExploringRef,
    executeExplorationMove,
    resetExploration,
  };
}
