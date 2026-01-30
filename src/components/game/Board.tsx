import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs, DraggingPieceDataType } from "react-chessboard";
import { useWebSocket } from "../../context/WebSocketContext";
import type { PlayerColor } from "../../types/chess";
import { theme } from "../../config/theme";

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

function Board({ gameId, playerColor, initialTurn, initialPgn, onTurnChange, onPgnChange, onSizeChange, overridePosition, isViewingHistory = false }: BoardProps) {
  const { sendMessage, lastMessage } = useWebSocket();
  const [chessGame] = useState(() => createChessInstance(initialPgn));

  const [chessPosition, setChessPosition] = useState(() => chessGame.fen());
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>(initialTurn);
  const moveSoundRef = useRef(new Audio("/sounds/move.mp3"));

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.action === "move") {
      try {
        chessGame.move({
          from: lastMessage.move.slice(0, 2),
          to: lastMessage.move.slice(2, 4),
          promotion: "q",
        });
        setChessPosition(chessGame.fen());
        moveSoundRef.current.play();
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

  const isPromotion = (target: string, piece: DraggingPieceDataType): boolean => {
    return (
      (piece.pieceType === "wP" && target[1] === "8") ||
      (piece.pieceType === "bP" && target[1] === "1")
    );
  };

  function onPieceDrop({ sourceSquare, targetSquare, piece }: PieceDropHandlerArgs): boolean {
    if (!gameId) {
      return false;
    }
    if (!targetSquare) {
      return false;
    }
    if (isViewingHistory) {
      return false;
    }
    if (playerColor !== currentTurn) {
      console.log("Not your turn");
      return false;
    }

    let move = `${sourceSquare}${targetSquare}`;
    chessGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    setChessPosition(chessGame.fen());
    moveSoundRef.current.play();

    if (isPromotion(targetSquare, piece)) {
      move += "q";
    }

    sendMove(move);
    setCurrentTurn((prev) => (prev === "white" ? "black" : "white"));
    onTurnChange?.(currentTurn === "white" ? "black" : "white");
    onPgnChange?.(chessGame.pgn());
    return false;
  }

  // Calculate optimal board size to fit viewport without scrolling
  const calculateOptimalSize = useCallback(() => {
    if (typeof window === "undefined") return 400;

    // Account for: page padding (40px), player rows (~60px total), sidebar (~340px)
    const verticalPadding = 200; // padding + player name rows
    const horizontalPadding = 400; // padding + sidebar space

    const maxWidth = window.innerWidth - horizontalPadding;
    const maxHeight = window.innerHeight - verticalPadding;

    // Board must be square, so use the smaller dimension
    const optimalSize = Math.min(maxWidth, maxHeight);

    // Clamp between min and max
    const minSize = 300;
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
    const minSize = 300;
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
    boardOrientation: playerColor,
    animationDurationInMs: 0,
    onPieceDrop,
    id: "on-piece-drop",
  };

  return (
    <div style={{ position: "relative", width: boardSize, height: boardSize }}>
      <Chessboard options={chessboardOptions} />
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
    </div>
  );
}

export default Board;
