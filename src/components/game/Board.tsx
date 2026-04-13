import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";
import { useWebSocket } from "../../context/WebSocketContext";
import { useSettings } from "../../context/SettingsContext";
import type { PlayerColor, GameResult } from "../../types/chess";
import { theme } from "../../config/theme";
import PromotionPicker, { type PromotionPiece } from "./PromotionPicker";
import { SoundManager } from "../../utils/SoundManager";
import { useExploration } from "../../hooks/useExploration";

interface BoardProps {
  gameId: string | null;
  playerColor: PlayerColor;
  initialTurn: PlayerColor;
  initialPgn?: string | null;
  onTurnChange?: (turn: PlayerColor) => void;
  onPgnChange?: (pgn: string) => void;
  onSizeChange?: (size: number) => void;
  overridePosition?: string | null;
  isViewingHistory?: boolean;
  autoPromoteToQueen?: boolean;
  gameResult?: GameResult | null;
  flipped?: boolean;
  isSpectator?: boolean;
  onExplorationChange?: (isExploring: boolean) => void;
  onExplorationPgnChange?: (pgn: string) => void;
  resetExploration?: number;
  viewedMoveIndex?: number | null;
}

function createChessInstance(pgn?: string | null): Chess {
  const chess = new Chess();
  if (pgn) {
    try {
      chess.loadPgn(pgn);
    } catch (error) {
      console.error("Failed to load PGN:", error);
    }
  }
  return chess;
}

function getLegalDests(chess: Chess): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>();
  for (const move of chess.moves({ verbose: true })) {
    const from = move.from as Key;
    if (!dests.has(from)) dests.set(from, []);
    dests.get(from)!.push(move.to as Key);
  }

  // Add extra castling destinations (rook square + intermediate squares)
  const kingSquare = (chess.turn() === 'w' ? 'e1' : 'e8') as Key;
  const kingDests = dests.get(kingSquare);
  if (kingDests) {
    const rank = chess.turn() === 'w' ? '1' : '8';
    if (kingDests.includes(`g${rank}` as Key)) {
      if (!kingDests.includes(`f${rank}` as Key)) kingDests.push(`f${rank}` as Key);
      if (!kingDests.includes(`h${rank}` as Key)) kingDests.push(`h${rank}` as Key);
    }
    if (kingDests.includes(`c${rank}` as Key)) {
      if (!kingDests.includes(`d${rank}` as Key)) kingDests.push(`d${rank}` as Key);
      if (!kingDests.includes(`b${rank}` as Key)) kingDests.push(`b${rank}` as Key);
      if (!kingDests.includes(`a${rank}` as Key)) kingDests.push(`a${rank}` as Key);
    }
  }

  return dests;
}

function Board({ gameId, playerColor, initialTurn, initialPgn, onTurnChange, onPgnChange, onSizeChange, overridePosition, isViewingHistory = false, autoPromoteToQueen = true, gameResult = null, flipped: flippedProp = false, isSpectator = false, onExplorationChange, onExplorationPgnChange, resetExploration = 0, viewedMoveIndex: viewedMoveIndexProp = null }: BoardProps) {
  const { sendMessage, subscribe } = useWebSocket();
  const { premovesEnabled } = useSettings();
  const [chessGame] = useState(() => createChessInstance(initialPgn));

  const [chessPosition, setChessPosition] = useState(() => chessGame.fen());
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>(initialTurn);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [hasPremoves, setHasPremoves] = useState(false);

  const viewedMoveIndexRef = useRef(viewedMoveIndexProp);
  const chessGameRef = useRef(chessGame);

  const { explorationChessRef, isExploringRef, executeExplorationMove, resetExploration: resetExplorationState } = useExploration({
    chessGameRef,
    viewedMoveIndexRef,
    onExplorationChange,
    onExplorationPgnChange,
  });

  const boardRef = useRef<HTMLDivElement>(null);
  const skipNextFenEffect = useRef(false);
  const cgApiRef = useRef<Api | null>(null);

  // Store callbacks in refs so chessground event handler always has latest values
  const gameIdRef = useRef(gameId);
  const playerColorRef = useRef(playerColor);
  const currentTurnRef = useRef(currentTurn);
  const isViewingHistoryRef = useRef(isViewingHistory);
  const autoPromoteToQueenRef = useRef(autoPromoteToQueen);
  const gameResultRef = useRef(gameResult);
  const isSpectatorRef = useRef(isSpectator);
  const onPgnChangeRef = useRef(onPgnChange);

  useEffect(() => { gameIdRef.current = gameId; }, [gameId]);
  useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);
  useEffect(() => { currentTurnRef.current = currentTurn; }, [currentTurn]);
  useEffect(() => { isViewingHistoryRef.current = isViewingHistory; }, [isViewingHistory]);
  useEffect(() => { autoPromoteToQueenRef.current = autoPromoteToQueen; }, [autoPromoteToQueen]);
  useEffect(() => { gameResultRef.current = gameResult; }, [gameResult]);
  useEffect(() => { chessGameRef.current = chessGame; }, [chessGame]);
  useEffect(() => { isSpectatorRef.current = isSpectator; }, [isSpectator]);
  useEffect(() => { onPgnChangeRef.current = onPgnChange; }, [onPgnChange]);
  useEffect(() => { viewedMoveIndexRef.current = viewedMoveIndexProp; }, [viewedMoveIndexProp]);

  const playMoveSound = (isCheck = false) => {
    SoundManager.play(isCheck ? "check" : "move");
  };

  const hasPremovesRef = useRef(hasPremoves);
  const isPremoveExecution = useRef(false);
  useEffect(() => { hasPremovesRef.current = hasPremoves; }, [hasPremoves]);

  const sendMove = useCallback((moveStr: string) => {
    sendMessage({
      action: "move",
      gameId: gameIdRef.current,
      move: moveStr,
      time: new Date().toISOString(),
      premove: isPremoveExecution.current,
    });
    isPremoveExecution.current = false;
  }, [sendMessage]);

  // Check if a move is a pawn promotion
  const isPromotionMove = (from: string, to: string, chess?: Chess): boolean => {
    const piece = (chess || chessGame).get(from as Square);
    if (!piece || piece.type !== "p") return false;
    return (piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1");
  };

  // Execute a move with optional promotion piece
  const executeMove = useCallback((from: string, to: string, promotion?: PromotionPiece): boolean => {
    const chess = chessGameRef.current;
    try {
      const moveResult = chess.move({
        from,
        to,
        promotion: promotion || "q",
      });

      if (!moveResult) return false;

      const newFen = chess.fen();
      setChessPosition(newFen);
      setLastMove({ from, to });
      playMoveSound(chess.inCheck());

      const move = promotion ? `${from}${to}${promotion}` : `${from}${to}`;
      if (gameId) sendMove(move);
      const newTurn: PlayerColor = chess.turn() === 'w' ? 'white' : 'black';
      setCurrentTurn(newTurn);
      onTurnChange?.(newTurn);
      onPgnChange?.(chess.pgn());

      // Update chessground with new position and legal moves
      cgApiRef.current?.set({
        fen: newFen,
        lastMove: [from as Key, to as Key],
        turnColor: newTurn,
        movable: {
          color: playerColorRef.current,
          dests: newTurn === playerColorRef.current ? getLegalDests(chess) : new Map(),
        },

      });

      return true;
    } catch {
      return false;
    }
  }, [sendMove, onTurnChange, onPgnChange]);

  // Wrapper around hook's executeExplorationMove that also updates Chessground
  const doExplorationMove = useCallback((from: string, to: string, promotion?: PromotionPiece) => {
    const result = executeExplorationMove(from, to, promotion);
    if (!result) {
      // Failed move — restore position from exploration instance or live game
      const fen = explorationChessRef.current?.fen() ?? chessGameRef.current.fen();
      cgApiRef.current?.set({ fen });
      return;
    }
    cgApiRef.current?.set({
      fen: result.fen,
      lastMove: [from as Key, to as Key],
      turnColor: result.turn,
      movable: {
        color: result.turn,
        dests: getLegalDests(explorationChessRef.current!),
      },
    });
    playMoveSound(result.isCheck);
  }, [executeExplorationMove]);

  // Handle chessground move event (unified for drag and click-to-move)
  const handleCgMove = useCallback((orig: Key, dest: Key) => {
    // Pick the active chess instance (exploration for spectators, live otherwise)
    const chess = (isSpectatorRef.current && explorationChessRef.current)
      ? explorationChessRef.current
      : chessGameRef.current;
    const doMove = isSpectatorRef.current ? doExplorationMove : executeMove;

    // Translate castling moves: any king move 2+ squares maps to standard castling dest
    const piece = chess.get(orig as Square);
    if (piece?.type === 'k') {
      const destFile = dest.charCodeAt(0) - 97;
      const origFile = orig.charCodeAt(0) - 97;
      const rank = orig[1];
      if (destFile - origFile >= 2) dest = `g${rank}` as Key;
      else if (origFile - destFile >= 2) dest = `c${rank}` as Key;
    }

    // Check if this is a promotion
    if (isPromotionMove(orig, dest, chess)) {
      if (autoPromoteToQueenRef.current) {
        doMove(orig, dest, "q");
      } else {
        // Revert the visual move chessground already made
        cgApiRef.current?.set({ fen: chess.fen() });
        setPendingPromotion({ from: orig, to: dest });
      }
      return;
    }

    doMove(orig, dest);
  }, [executeMove, doExplorationMove]);

  // Handle promotion piece selection
  const handlePromotionSelect = (piece: PromotionPiece) => {
    if (pendingPromotion) {
      if (isSpectator) {
        doExplorationMove(pendingPromotion.from, pendingPromotion.to, piece);
      } else {
        executeMove(pendingPromotion.from, pendingPromotion.to, piece);
      }
      setPendingPromotion(null);
    }
  };

  const cancelPromotion = () => {
    setPendingPromotion(null);
    // Restore position after canceling
    cgApiRef.current?.set({ fen: chessGame.fen() });
  };

  // Determine if the player can move
  const getMovableColor = (): PlayerColor | undefined => {
    if (isSpectator) {
      // Spectators can always move — from live position, history, or ongoing exploration
      if (isExploringRef.current && explorationChessRef.current) {
        return explorationChessRef.current.turn() === 'w' ? 'white' : 'black';
      }
      // When viewing history, the turn at that position determines movable color
      if (overridePosition) {
        // Derive turn from the override FEN
        const parts = overridePosition.split(' ');
        return parts[1] === 'b' ? 'black' : 'white';
      }
      return currentTurn;
    }
    if (gameResult !== null || isViewingHistory) return undefined;
    if (!gameId) return currentTurn;
    return playerColor;
  };

  const getOrientation = (): 'white' | 'black' => {
    if (flippedProp) {
      return playerColor === 'white' ? 'black' : 'white';
    }
    return playerColor;
  };

  // Initialize chessground
  useEffect(() => {
    if (!boardRef.current) return;

    const movableColor = getMovableColor();
    const api = Chessground(boardRef.current, {
      fen: overridePosition ?? chessPosition,
      orientation: getOrientation(),
      turnColor: currentTurn,
      lastMove: lastMove ? [lastMove.from as Key, lastMove.to as Key] : undefined,

      coordinates: boardSize >= 500,
      animation: { enabled: false },
      movable: {
        free: false,
        color: movableColor,
        dests: movableColor ? getLegalDests(chessGame) : new Map(),
        showDests: false,
        events: {
          after: handleCgMove,
        },
      },
      draggable: {
        enabled: true,
        showGhost: false,
      },
      selectable: {
        enabled: true,
      },
      premovable: {
        enabled: premovesEnabled,
        maxQueue: 10,
        showDests: false,
        additionalPremoveRequirements: (ctx) => {
          // Never allow capturing your own king
          const destPiece = ctx.allPieces.get(ctx.dest.key);
          if (destPiece && destPiece.color === ctx.color && destPiece.role === 'king') return false;

          // Only filter castling — allow all other premoves
          if (ctx.role !== 'king') return true;
          const fileDiff = Math.abs(ctx.dest.pos[0] - ctx.orig.pos[0]);
          if (fileDiff <= 1) return true; // Normal king move, not castling

          // Castling attempt — check FEN castling rights
          const fen = chessGameRef.current.fen();
          const rights = fen.split(' ')[2] || '-';
          const isKingside = ctx.dest.pos[0] > ctx.orig.pos[0];
          if (ctx.color === 'white') {
            if (isKingside && !rights.includes('K')) return false;
            if (!isKingside && !rights.includes('Q')) return false;
          } else {
            if (isKingside && !rights.includes('k')) return false;
            if (!isKingside && !rights.includes('q')) return false;
          }

          const rank = ctx.color === 'white' ? '1' : '8';
          const kingStart = ('e' + rank) as Key;
          const rookStart = ((isKingside ? 'h' : 'a') + rank) as Key;

          // Check if king or relevant rook ever moved in the premove queue
          const queue = cgApiRef.current?.state?.premovable?.queue ?? [];
          for (const [orig] of queue) {
            if (orig === kingStart) return false; // King moved from starting square
            if (orig === rookStart) return false; // Rook moved from starting square
          }

          // Check rook is still on its starting square in visual state
          const rook = ctx.allPieces.get(rookStart);
          if (!rook || rook.role !== 'rook' || rook.color !== ctx.color) return false;

          // Check empty squares between king and rook
          if (isKingside) {
            if (ctx.allPieces.has(('f' + rank) as Key) || ctx.allPieces.has(('g' + rank) as Key)) return false;
          } else {
            if (ctx.allPieces.has(('b' + rank) as Key) || ctx.allPieces.has(('c' + rank) as Key) || ctx.allPieces.has(('d' + rank) as Key)) return false;
          }
          return true;
        },
        events: {
          set: () => setHasPremoves(true),
          unset: () => setHasPremoves(false),
        },
      },
      drawable: {
        enabled: true,
        visible: true,
        defaultSnapToValidMove: false,
        brushes: {
          green: { key: 'green', color: '#098d4e', opacity: 0.8, lineWidth: 10 },
          red: { key: 'red', color: '#ff1744', opacity: 0.8, lineWidth: 10 },
          blue: { key: 'blue', color: '#d500f9', opacity: 0.8, lineWidth: 10 },
          yellow: { key: 'yellow', color: '#ffea00', opacity: 0.8, lineWidth: 10 },
        },
      },
    });

    cgApiRef.current = api;

    return () => {
      api.destroy();
      cgApiRef.current = null;
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update position when it changes (own moves, opponent moves, history navigation)
  useEffect(() => {
    if (skipNextFenEffect.current) {
      skipNextFenEffect.current = false;
      return;
    }
    // During exploration, only update for history navigation within the exploration line
    // (overridePosition carries the exploration FEN when scrolled back, null when at latest)
    if (isExploringRef.current && !overridePosition) return;
    const fen = overridePosition ?? chessPosition;
    cgApiRef.current?.set({
      fen,
      lastMove: (lastMove && !isViewingHistory) ? [lastMove.from as Key, lastMove.to as Key] : undefined,
    });
  }, [chessPosition, overridePosition, lastMove, isViewingHistory, chessGame]);

  // Update orientation when flipped or playerColor changes
  useEffect(() => {
    cgApiRef.current?.set({
      orientation: getOrientation(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerColor, flippedProp]);

  // Update movable state when turn/game state changes
  useEffect(() => {
    // During exploration, only update when scrolled back (overridePosition set)
    if (isExploringRef.current && !overridePosition) return;
    const movableColor = getMovableColor();

    // For spectators viewing a history position, compute dests from the override FEN.
    // At the live position (isViewingHistory false), use the live chessGame instance.
    let dests: Map<Key, Key[]> = new Map();
    if (movableColor) {
      if (isSpectator && isViewingHistory && overridePosition) {
        const historyChess = new Chess(overridePosition);
        dests = getLegalDests(historyChess);
      } else {
        dests = getLegalDests(chessGame);
      }
    }

    cgApiRef.current?.set({
      turnColor: currentTurn,
      movable: {
        color: movableColor,
        dests,
      },
    });
    if (gameResult !== null) {
      cgApiRef.current?.cancelPremove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn, gameId, isViewingHistory, gameResult, playerColor, chessPosition]);

  // Update spectator movable dests when navigating history positions (live or exploration)
  useEffect(() => {
    if (!isSpectator || !overridePosition || !isViewingHistory) return;
    const parts = overridePosition.split(' ');
    const turnColor: PlayerColor = parts[1] === 'b' ? 'black' : 'white';
    const historyChess = new Chess(overridePosition);
    cgApiRef.current?.set({
      turnColor,
      movable: {
        color: turnColor,
        dests: getLegalDests(historyChess),
      },
    });
  }, [isSpectator, overridePosition, isViewingHistory]);

  // Update move handler when it changes
  useEffect(() => {
    cgApiRef.current?.set({
      movable: {
        events: {
          after: handleCgMove,
        },
      },
    });
  }, [handleCgMove]);

  // Reset spectator exploration when parent signals "jump to live"
  useEffect(() => {
    if (resetExploration === 0) return;
    resetExplorationState();
    const chess = chessGameRef.current;
    const liveTurn: PlayerColor = chess.turn() === 'w' ? 'white' : 'black';
    cgApiRef.current?.set({
      fen: chess.fen(),
      turnColor: liveTurn,
      movable: {
        color: liveTurn,
        dests: getLegalDests(chess),
      },
    });
  }, [resetExploration, resetExplorationState]);

  // Sync premovesEnabled setting to chessground
  useEffect(() => {
    cgApiRef.current?.set({
      premovable: {
        enabled: premovesEnabled,
        maxQueue: 100,
        events: {
          set: () => setHasPremoves(true),
          unset: () => setHasPremoves(false),
        },
      },
    });
  }, [premovesEnabled]);

  // Handle opponent/spectator moves via WebSocket subscribe callback.
  useEffect(() => {
    return subscribe((msg) => {
      if (msg.action !== "move" || !msg.move || msg.gameId !== gameIdRef.current) return;

      const chess = chessGameRef.current;
      const pColor = playerColorRef.current;

      // Players skip their own move echoes (already applied locally in executeMove).
      // Spectators never make local moves, so they must apply everything.
      if (!isSpectatorRef.current) {
        const newTurn = msg.turn as PlayerColor;
        if (newTurn !== pColor) return;
      }

      const moveStr = msg.move;

      try {
        const from = moveStr.slice(0, 2);
        const to = moveStr.slice(2, 4);
        chess.move({
          from,
          to,
          promotion: moveStr.length > 4 ? moveStr[4] as PromotionPiece : undefined,
        });
        const newFen = chess.fen();
        const newTurn = msg.turn as PlayerColor;

        // If spectator is exploring, update live state silently but don't touch chessground
        if (isSpectatorRef.current && isExploringRef.current) {
          setChessPosition(newFen);
          setCurrentTurn(newTurn);
          onPgnChangeRef.current?.(chess.pgn());
          playMoveSound(chess.inCheck());
          return;
        }

        setChessPosition(newFen);
        setLastMove({ from, to });
        playMoveSound(chess.inCheck());
        setCurrentTurn(newTurn);
        onPgnChangeRef.current?.(chess.pgn());

        // Update chessground — skip the useEffect FEN sync since we're setting it here
        skipNextFenEffect.current = true;
        cgApiRef.current?.set({
          fen: newFen,
          lastMove: [from as Key, to as Key],
          turnColor: newTurn,
          movable: {
            color: isSpectatorRef.current ? newTurn : pColor,
            dests: isSpectatorRef.current ? getLegalDests(chess) : (newTurn === pColor ? getLegalDests(chess) : new Map()),
          },
        });

        // Execute premove immediately — .set() already updated chessground state synchronously
        if (!isSpectatorRef.current && newTurn === pColor) {
          const cg = cgApiRef.current;
          const hasQueuedPremoves = hasPremovesRef.current ||
            (cg?.state?.premovable?.queue?.length ?? 0) > 0;
          if (hasQueuedPremoves) {
            isPremoveExecution.current = true;
            const played = cg?.playPremove();
            if (!played) {
              isPremoveExecution.current = false;
              setHasPremoves(false);
            }
          }
        }
      } catch (error) {
        console.log("Failed to make move", error);
      }
    });
  }, [subscribe]);

  // Calculate optimal board size to fit viewport without scrolling
  const calculateOptimalSize = useCallback(() => {
    if (typeof window === "undefined") return 400;

    const isMobile = window.innerWidth < 768;
    const verticalPadding = isMobile ? 100 : 250;
    const horizontalPadding = isMobile ? 16 : 400;

    const maxWidth = window.innerWidth - horizontalPadding;
    const maxHeight = window.innerHeight - verticalPadding;

    const optimalSize = Math.min(maxWidth, maxHeight);

    const minSize = 320;
    const maxSize = 800;
    return Math.max(minSize, Math.min(maxSize, optimalSize));
  }, []);

  const [boardSize, setBoardSize] = useState(() => {
    const saved = localStorage.getItem("board-size");
    if (saved) {
      const n = Number(saved);
      if (!isNaN(n) && n >= 220 && n <= 800) return n;
    }
    return calculateOptimalSize();
  });
  const isResizing = useRef(false);
  const startPos = useRef({ x: 0, size: 0 });

  // Notify parent when board size changes
  useEffect(() => {
    onSizeChange?.(boardSize);
  }, [boardSize, onSizeChange]);

  // Redraw chessground when board size changes
  useEffect(() => {
    requestAnimationFrame(() => cgApiRef.current?.redrawAll());
  }, [boardSize]);

  // Auto-resize on window resize (disabled during active game)
  const isActiveGame = gameId !== null && gameResult === null;
  useEffect(() => {
    if (isActiveGame) return;
    const handleWindowResize = () => {
      if (!isResizing.current) {
        setBoardSize(calculateOptimalSize());
      }
    };
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [calculateOptimalSize, isActiveGame]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const delta = e.clientX - startPos.current.x;
    const minSize = 220;
    const maxSize = 800;
    const newSize = Math.max(minSize, Math.min(maxSize, startPos.current.size + delta));
    setBoardSize(newSize);
    localStorage.setItem("board-size", String(newSize));
  }, []);

  const handleResizeEnd = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startPos.current = { x: e.clientX, size: boardSize };
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  }, [boardSize, handleResizeMove, handleResizeEnd]);

  return (
    <div style={{ position: "relative", width: boardSize, height: boardSize, borderRadius: 8, overflow: "hidden", "--board-size": `${boardSize}px` } as React.CSSProperties}>
      <div ref={boardRef} style={{ width: '100%', height: '100%' }} />

      {pendingPromotion && (
        <PromotionPicker
          playerColor={playerColor}
          onSelect={handlePromotionSelect}
          onCancel={cancelPromotion}
        />
      )}

      {/* Hide resize handle during active game to avoid interfering with moves */}
      {!(gameId && gameResult === null) && (
        <div
          data-testid="board-resize-handle"
          onMouseDown={handleResizeStart}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 24,
            height: 24,
            cursor: "nwse-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.5,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              d="M16 2L2 16M16 8L8 16M16 14L14 16"
              stroke={theme.colors.text}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default Board;
