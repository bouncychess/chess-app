import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs, DraggingPieceDataType } from "react-chessboard";
import { useWebSocket } from "../../context/WebSocketContext";
import type { PlayerColor } from "../../types/chess";

interface BoardProps {
  gameId: string | null;
  playerColor: PlayerColor;
  initialTurn: PlayerColor;
  initialPgn?: string | null;
  onTurnChange?: (turn: PlayerColor) => void;
  onPgnChange?: (pgn: string) => void;
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

function Board({ gameId, playerColor, initialTurn, initialPgn, onTurnChange, onPgnChange, overridePosition, isViewingHistory = false }: BoardProps) {
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

  const chessboardOptions = {
    position: overridePosition ?? chessPosition,
    boardOrientation: playerColor,
    animationDurationInMs: 0,
    onPieceDrop,
    id: "on-piece-drop",
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <Chessboard options={chessboardOptions} />
    </div>
  );
}

export default Board;
