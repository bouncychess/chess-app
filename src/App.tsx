import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

function App() {
  const socketRef = useRef<WebSocket | null>(null);
  const chessRef = useRef(new Chess());
  const chessGame = chessRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());

  const [gameId, setGameId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">("white");
  const [text, setText] = useState<string>('');
  const [chatLog, setChatLog] = useState<string[]>([]);
  const moveSound = new Audio('/sounds/move.mp3');

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
      console.log("WebSocket connected");
      socket.send(JSON.stringify({ action: "play" }));
    };

    socket.onmessage = (event) => {
      console.log("Message from server:", event);
      try {
        const message = JSON.parse(event.data);
        console.log("Message", message);

        if (message.action === "startGame") {
          console.log("startGame", message);
          setGameId(message.gameId);
          setPlayerColor(message.color);
          setCurrentTurn(message.turn);
        }

        if (message.action === "chat") {
          console.log("chat", message);
          const chatText = `Rat: ${message.message}`;
          setChatLog((prevLog) => [...prevLog, chatText]);

        }

        if (message.action === "move") {
          console.log("opponentMove", message);
          chessGame.move({
            from: message.move.slice(0, 2),
            to: message.move.slice(2, 4),
            promotion: 'q' // always promote to a queen for example simplicity
          });
          console.log("Made Opponent Move");
          setChessPosition(chessGame.fen());
          moveSound.play();
          console.log("Updated Fen");
          setCurrentTurn(message.turn);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", event.data);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    socket.onclose = () => {
      console.warn("WebSocket closed");
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  const sendMove = (moveStr: string) => {
    console.log("Preparing to Send Move")
    if (gameId && socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("Sending Move")
      socketRef.current.send(
        JSON.stringify({
          action: "move",
          gameId: gameId,
          move: moveStr,
          time: new Date().toISOString()
        })
      );
    }
  };

  const sendChat = (message: string) => {
    console.log("Preparing to Send Chat")
    if (gameId && socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("Sending Chat")
      const chatText = `Player: ${message}`;
      setChatLog((prevLog) => [...prevLog, chatText]);
      socketRef.current.send(
        JSON.stringify({
          action: "chat",
          gameId: gameId,
          message: message
        })
      );
    }
  };

  const isPromotion = (source: string, target: string, piece: string): boolean => {
    // For white pawn reaching rank 8
    if (piece === 'wP' && target[1] === '8') return true;
    // For black pawn reaching rank 1
    if (piece === 'bP' && target[1] === '1') return true;
    return false;
  };

  const onPieceDrop = (source: object, target: object) => {
    console.log("Dropped Piece")
    console.log("Source", source)
    console.log("Target", target)
    if (playerColor != currentTurn) {
      console.log("Not your turn!");
      return;
    }
    if (gameId === null) {
        console.log("Game not started yet!");
        return;
    }
    try {
      const sourceSquare = source.sourceSquare;
      const targetSquare = source.targetSquare;
      const piece = source.piece.pieceType;
      let move = `${sourceSquare}${targetSquare}`
      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // always promote to a queen for example simplicity
      });
      // update the game state
      setChessPosition(chessGame.fen());
      moveSound.play();
      if (isPromotion(sourceSquare, targetSquare, piece)) {
        console.log("Promotion move detected");
        move = `${sourceSquare}${targetSquare}q`; // append 'q' for queen promotion
      }
      sendMove(move)
      setCurrentTurn((prevColor) => (prevColor === "white" ? "black" : "white"));
    } catch (e) {
      console.error("Illegal move", e);
    }
    return false;
  };

  const onChat = (message: string) => {
    try {
      console.log("Chatted", message)
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
      {gameId ? <p>Game ID: {gameId}</p> : <p>Waiting for game...</p>}
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

export default App;