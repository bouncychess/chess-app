import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
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
  const [text, setText] = useState<string>('');
  const [chatLog, setChatLog] = useState<string[]>([]);
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

    if (lastMessage.action === "chat") {
      const chatText = `Rat: ${lastMessage.message}`;
      setChatLog((prevLog) => [...prevLog, chatText]);
    }

    if (lastMessage.action === "move") {
      chessGame.move({
        from: lastMessage.move.slice(0, 2),
        to: lastMessage.move.slice(2, 4),
        promotion: 'q'
      });
      setChessPosition(chessGame.fen());
      moveSound.play();
      setCurrentTurn(lastMessage.turn);
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

  const sendChat = (message: string) => {
    if (gameId) {
      const chatText = `Player: ${message}`;
      setChatLog((prevLog) => [...prevLog, chatText]);
      sendMessage({
        action: "chat",
        gameId,
        message
      });
    }
  };

  const isPromotion = (source: string, target: string, piece: string): boolean => {
    return (piece === 'wP' && target[1] === '8') || (piece === 'bP' && target[1] === '1');
  };

  const onPlay = () => {
    if (isConnected) {
        sendMessage({ action: "play" });
        setStatus("Waiting for game...");
      }
  }

  const onPieceDrop = (source: any, target: any) => {
    console.log("piece dropped");
    if (!gameId) {
        console.log("Not playing game")
        return;
    }
    if (playerColor !== currentTurn) {
        console.log("Not your turn")
        return;
    }

    const sourceSquare = source.sourceSquare;
    const targetSquare = source.targetSquare;
    const piece = source.piece.pieceType;

    let move = `${sourceSquare}${targetSquare}`;
    chessGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    });

    setChessPosition(chessGame.fen());
    moveSound.play();

    if (isPromotion(sourceSquare, targetSquare, piece)) {
      move += 'q';
    }

    sendMove(move);
    setCurrentTurn((prev) => (prev === "white" ? "black" : "white"));
    return false;
  };

  const onChat = (message: string) => {
    try {
      sendChat(message);
    } catch (e) {
      console.error("Failed to send chat", e);
    }
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
      <div>
        <input
          type="text"
          placeholder="Type message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onChat(text);
              setText('');
            }
          }}
        />
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ccc', padding: 8 }}>
          {chatLog.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Play;