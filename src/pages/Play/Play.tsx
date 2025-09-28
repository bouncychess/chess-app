import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import Chat from "../Play/components/Chat"
import type {PieceDropHandlerArgs, DraggingPieceDataType} from "react-chessboard";
import { useWebSocket } from "../../context/WebSocketContext";

function Play() {
  const { sendMessage, lastMessage, isConnected } = useWebSocket();
  const chessRef = useRef(new Chess());
  const chessGame = chessRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [gameId, setGameId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Online");
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">("white");
  const moveSound = new Audio('/sounds/move.mp3');

  // 🔁 Handle incoming messages
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.action === "startGame") {
      console.log(lastMessage);
      setGameId(lastMessage.gameId);
      setPlayerColor(lastMessage.color);
      setCurrentTurn(lastMessage.turn);
      setStatus("Playing");
    }
    if (lastMessage.action === "move") {
      try {
        chessGame.move({
            from: lastMessage.move.slice(0, 2),
            to: lastMessage.move.slice(2, 4),
            promotion: 'q'
          });
          setChessPosition(chessGame.fen());
          moveSound.play();
          setCurrentTurn(lastMessage.turn);
      } catch (error) {
        console.log("Failed to make move")
      }
    }
  }, [lastMessage]);

  const sendMove = (moveStr: string) => {
    if (gameId) {
      sendMessage({
        action: "move",
        gameId,
        move: moveStr,
        time: new Date().toISOString()
      });
    }
  };

  const isPromotion = (target: string, piece: DraggingPieceDataType): boolean => {
    return (piece.pieceType === 'wP' && target[1] === '8') || (piece.pieceType === 'bP' && target[1] === '1');
  };

  const onPlay = () => {
    if (gameId) {
        console.log("Already Playing")
        return;
    }
    if (isConnected) {
        sendMessage({ action: "play" });
        setStatus("Waiting for game...");
      }
  }

  function onPieceDrop({ sourceSquare, targetSquare, piece }: PieceDropHandlerArgs): boolean {
    console.log("piece dropped");
    console.log("sourceSquare", sourceSquare);
    console.log("targetSquare", targetSquare);
    console.log("piece", piece);
    if (!gameId) {
        console.log("Not playing game")
        return false;
    }
    if (!targetSquare) {
        console.log("No target square")
        return false;
    }
    if (playerColor !== currentTurn) {
        console.log("Not your turn")
        return false;
    }

    let move = `${sourceSquare}${targetSquare}`;
    console.log("move", move)
    chessGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    });

    setChessPosition(chessGame.fen());
    moveSound.play();

    if (isPromotion(targetSquare, piece)) {
      move += 'q';
    }

    sendMove(move);
    setCurrentTurn((prev) => (prev === "white" ? "black" : "white"));
    return false;
  };

  // chessboard options
  const chessboardOptions = {
      position: chessPosition,
      boardOrientation: playerColor,
      onPieceDrop,
      id: 'on-piece-drop'
  };


  return (
    <div style={{ padding: 20 }}>
      <h2>Chess Live</h2>
      <p>Status: {status} {gameId} </p>
      <button type="button" onClick={onPlay}>Play</button>
      <div style={{ maxWidth: 480 }}>
        <Chessboard options={chessboardOptions} />
      </div>
      <Chat gameId={gameId}/>
    </div>
  );
}

export default Play;