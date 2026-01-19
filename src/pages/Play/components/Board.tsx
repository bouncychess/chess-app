import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs, DraggingPieceDataType } from "react-chessboard";
import { useWebSocket } from "../../../context/WebSocketContext";

interface BoardProps {
  gameId: string | null;
  playerColor: "white" | "black";
  initialTurn: "white" | "black";
}

function Board({ gameId, playerColor, initialTurn }: BoardProps) {
  const { sendMessage, lastMessage } = useWebSocket();
  const chessRef = useRef(new Chess());
  const chessGame = chessRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">(initialTurn);
  const moveSound = new Audio("/sounds/move.mp3");

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
        moveSound.play();
        setCurrentTurn(lastMessage.turn);
      } catch (error) {
        console.log("Failed to make move");
      }
    }
  }, [lastMessage]);

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
    moveSound.play();

    if (isPromotion(targetSquare, piece)) {
      move += "q";
    }

    sendMove(move);
    setCurrentTurn((prev) => (prev === "white" ? "black" : "white"));
    return false;
  }

  const chessboardOptions = {
    position: chessPosition,
    boardOrientation: playerColor,
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
