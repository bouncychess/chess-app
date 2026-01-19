import { useEffect, useState } from "react";
import { useWebSocket } from "../../context/WebSocketContext";
import Board from "./components/Board";
import Chat from "./components/Chat";
import Players from "./components/Players";
import type { PlayerColor } from "../../types/chess";

interface Player {
  id: string;
  name: string;
}

function Play() {
  const { sendMessage, lastMessage, isConnected } = useWebSocket();

  const [gameId, setGameId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Online");
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>("white");
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.action === "startGame") {
      setGameId(lastMessage.gameId);
      setPlayerColor(lastMessage.color);
      setCurrentTurn(lastMessage.turn);
      setStatus("Playing");
    }
    if (lastMessage.action === "players") {
      setPlayers(lastMessage.players);
    }
  }, [lastMessage]);

  const onPlay = () => {
    if (gameId) {
      console.log("Already Playing");
      return;
    }
    if (isConnected) {
      sendMessage({ action: "play" });
      setStatus("Waiting for game...");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Chess Live</h2>
      <p>Status: {status} {gameId}</p>
      <button type="button" onClick={onPlay}>Play</button>
      <div style={{ display: "flex", gap: 20 }}>
        <Board
          gameId={gameId}
          playerColor={playerColor}
          initialTurn={currentTurn}
        />
        <Players players={players} />
      </div>
      {gameId && <Chat gameId={gameId} />}
    </div>
  );
}

export default Play;
