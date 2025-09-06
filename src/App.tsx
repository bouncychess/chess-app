import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

const WEBSOCKET_URL = "wss://fawbaixsvh.execute-api.us-east-1.amazonaws.com/dev/";

function App() {
  const socketRef = useRef<WebSocket | null>(null);
  const chessRef = useRef(new Chess());
  const chessGame = chessRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());

  const [fen, setFen] = useState(chessRef.current.fen());
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");

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
        }

        if (message.action === "oppMove") {
          console.log("opponentMove", message);
          chessGame.move({
            from: message.move.slice(0, 2),
            to: message.move.slice(2),
            promotion: 'q' // always promote to a queen for example simplicity
          });
          console.log("Made Opponent Move");
          setChessPosition(chessGame.fen());
          console.log("Updated Fen");
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
        })
      );
    }
  };

  const onPieceDrop = (source: object, target: object) => {
    console.log("Dropped Piece")
    try {
      console.log(source)
      const sourceSquare = source.sourceSquare;
      const targetSquare = source.targetSquare;
      console.log(`${sourceSquare}${targetSquare}`)
      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // always promote to a queen for example simplicity
      });
      // update the game state
      setChessPosition(chessGame.fen());
      sendMove(`${sourceSquare}${targetSquare}`)
    } catch (e) {
      console.error("Illegal move", e);
    }
    return false;
  };

  // chessboard options
  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    id: 'on-piece-drop'
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Chesstard Live</h2>
      {gameId ? <p>Game ID: {gameId}</p> : <p>Waiting for game...</p>}
      <div style={{ maxWidth: 480 }}>
          <Chessboard options={chessboardOptions} />
      </div>
    </div>
  );
}

export default App;