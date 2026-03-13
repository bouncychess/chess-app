import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";
import { useWebSocket } from "../../context/WebSocketContext";
import type { PlayerColor, GameResult } from "../../types/chess";
import { theme } from "../../config/theme";
import PromotionPicker, { type PromotionPiece } from "./PromotionPicker";

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

function Board({ gameId, playerColor, initialTurn, initialPgn, onTurnChange, onPgnChange, onSizeChange, overridePosition, isViewingHistory = false, autoPromoteToQueen = true, gameResult = null, flipped: flippedProp = false }: BoardProps) {
  const { sendMessage, lastMessage } = useWebSocket();
  const [chessGame] = useState(() => createChessInstance(initialPgn));

  const [chessPosition, setChessPosition] = useState(() => chessGame.fen());
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>(initialTurn);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const moveSoundRef = useRef(new Audio("/sounds/move.mp3"));
  const prevSelectedRef = useRef<Square | null>(null);

  const playMoveSound = () => {
    moveSoundRef.current.currentTime = 0;
    moveSoundRef.current.volume = 1;
    moveSoundRef.current.playbackRate = 2;
    moveSoundRef.current.play().catch(() => {});
  };

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.action === "move") {
      try {
        const moveStr = lastMessage.move;
        const from = moveStr.slice(0, 2);
        const to = moveStr.slice(2, 4);
        chessGame.move({
          from,
          to,
          promotion: moveStr.length > 4 ? moveStr[4] as PromotionPiece : undefined,
        });
        setChessPosition(chessGame.fen());
        setLastMove({ from, to });
        playMoveSound();
        setCurrentTurn(lastMessage.turn);
        onPgnChange?.(chessGame.pgn());
      } catch (error) {
        console.log("Failed to make move", error);
      }
    }
  }, [lastMessage, chessGame]);

  const sendMove = (moveStr: string) => {
    sendMessage({
      action: "move",
      gameId,
      move: moveStr,
      time: new Date().toISOString(),
    });
  };

  // Check if a move is a pawn promotion
  const isPromotionMove = (from: string, to: string): boolean => {
    const piece = chessGame.get(from as Square);
    if (!piece || piece.type !== "p") return false;
    return (piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1");
  };

  // Execute a move with optional promotion piece
  const executeMove = (from: string, to: string, promotion?: PromotionPiece): boolean => {
    try {
      const moveResult = chessGame.move({
        from,
        to,
        promotion: promotion || "q",
      });

      if (!moveResult) return false;

      setChessPosition(chessGame.fen());
      setLastMove({ from, to });
      playMoveSound();

      const move = promotion ? `${from}${to}${promotion}` : `${from}${to}`;
      sendMove(move);
      const newTurn: PlayerColor = chessGame.turn() === 'w' ? 'white' : 'black';
      setCurrentTurn(newTurn);
      onTurnChange?.(newTurn);
      onPgnChange?.(chessGame.pgn());
      return true;
    } catch {
      return false;
    }
  };

  // Attempt to make a move (used by both drag-drop and click-to-move)
  const tryMove = (from: string, to: string): boolean => {
    // Use chess.js turn directly to avoid stale React state during pre-drag
    const actualTurn = chessGame.turn() === 'w' ? 'white' : 'black';
    if (!gameId || isViewingHistory || gameResult !== null || playerColor !== actualTurn) {
      return false;
    }

    // Check if this is a promotion
    if (isPromotionMove(from, to)) {
      if (autoPromoteToQueen) {
        return executeMove(from, to, "q");
      }
      // Show the picker
      setPendingPromotion({ from, to });
      return true;
    }

    return executeMove(from, to);
  };

  // Handle promotion piece selection
  const handlePromotionSelect = (piece: PromotionPiece) => {
    if (pendingPromotion) {
      executeMove(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
    }
  };

  const cancelPromotion = () => {
    setPendingPromotion(null);
  };

  function onPieceDrag(): void {
    setSelectedSquare(null);
  }

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    if (!targetSquare) return false;
    setSelectedSquare(null);
    return tryMove(sourceSquare, targetSquare);
  }

  function onSquareClick({ square }: SquareHandlerArgs): void {
    const sq = square as Square;
    const piece = chessGame.get(sq);
    const prevSelected = prevSelectedRef.current;
    prevSelectedRef.current = null;

    // If viewing history, don't allow selection
    if (isViewingHistory) {
      return;
    }

    // If we had a selected square (from before pointerDown cleared it)
    if (prevSelected) {
      // If clicking the same square, stay deselected
      if (prevSelected === sq) {
        return;
      }

      // If it's our turn, try to move there
      if (gameId && playerColor === currentTurn) {
        const moved = tryMove(prevSelected, sq);
        if (moved) {
          return;
        }
      }

      // If clicked on own piece, switch selection to it
      if (piece && piece.color === (playerColor === "white" ? "w" : "b")) {
        setSelectedSquare(sq);
      }
      return;
    }

    // No piece selected - select own piece if clicked
    if (piece && piece.color === (playerColor === "white" ? "w" : "b")) {
      setSelectedSquare(sq);
    }
  }

  // Get styles for selected square and last move highlight
  const getSquareStyles = (): Record<string, React.CSSProperties> => {
    const styles: Record<string, React.CSSProperties> = {};

    // Highlight last move squares (only when viewing current position)
    if (lastMove && !isViewingHistory) {
      const highlightStyle = {
        backgroundColor: theme.colors.moveHighlight,
      };
      styles[lastMove.from] = highlightStyle;
      styles[lastMove.to] = highlightStyle;
    }

    // Highlight selected square (adds to last move highlight if same square)
    if (selectedSquare) {
      const borderWidth = Math.round(boardSize * 0.06 / 8);
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        boxShadow: `inset 0 0 0 ${borderWidth}px ${theme.colors.squareHighlight}`,
      };
    }

    return styles;
  };

  // Calculate optimal board size to fit viewport without scrolling
  const calculateOptimalSize = useCallback(() => {
    if (typeof window === "undefined") return 400;

    // Account for: page padding (40px), player rows (~60px total), sidebar (~340px)
    const verticalPadding = 250; // padding + player name rows
    const horizontalPadding = 400; // padding + sidebar space

    const maxWidth = window.innerWidth - horizontalPadding;
    const maxHeight = window.innerHeight - verticalPadding;

    // Board must be square, so use the smaller dimension
    const optimalSize = Math.min(maxWidth, maxHeight);

    // Clamp between min and max
    const minSize = 220;
    const maxSize = 800;
    return Math.max(minSize, Math.min(maxSize, optimalSize));
  }, []);

  const [boardSize, setBoardSize] = useState(calculateOptimalSize);
  const isResizing = useRef(false);
  const startPos = useRef({ x: 0, size: 0 });

  // Notify parent when board size changes
  useEffect(() => {
    onSizeChange?.(boardSize);
  }, [boardSize, onSizeChange]);

  // Auto-resize on window resize (only if not manually resizing)
  useEffect(() => {
    const handleWindowResize = () => {
      if (!isResizing.current) {
        setBoardSize(calculateOptimalSize());
      }
    };
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [calculateOptimalSize]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const delta = e.clientX - startPos.current.x;
    const minSize = 220;
    const maxSize = 800;
    const newSize = Math.max(minSize, Math.min(maxSize, startPos.current.size + delta));
    setBoardSize(newSize);
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

  const chessboardOptions = {
    position: overridePosition ?? chessPosition,
    boardOrientation: flippedProp ? (playerColor === 'white' ? 'black' : 'white') : playerColor,
    animationDurationInMs: 0,
    showAnimations: false,
    onPieceDrop,
    onPieceDrag,
    onSquareClick,
    squareStyles: getSquareStyles(),
    id: "on-piece-drop",
    draggingPieceStyle: { transform: 'scale(1)' },
    draggingPieceGhostStyle: { opacity: 0 },
    darkSquareStyle: {
      backgroundColor: '#5b8fb9'
    },
    lightSquareStyle: {
      backgroundColor: "#f0f4f8"
    },
    arrowOptions: {
      color: "#20b2aa", // sea green
      secondaryColor: "#2e8b57", // darker sea green
      tertiaryColor: "#3cb371", // medium sea green
      arrowLengthReducerDenominator: 8,
      sameTargetArrowLengthReducerDenominator: 4,
      arrowWidthDenominator: 5,
      activeArrowWidthMultiplier: 0.9,
      opacity: 0.5,
      activeOpacity: 0.3,
    }
  };

  return (
    <div style={{ position: "relative", width: boardSize, height: boardSize, borderRadius: 8, overflow: "hidden" }}>
      <div onPointerDown={() => {
        prevSelectedRef.current = selectedSquare;
        setSelectedSquare(null);
      }}>
        <Chessboard options={chessboardOptions} />
      </div>

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
