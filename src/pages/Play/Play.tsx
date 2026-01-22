import { useEffect, useState } from "react";
import { useWebSocket } from "../../context/WebSocketContext";
import Board from "./components/Board";
import Chat from "./components/Chat";
import Players from "./components/Players";
import { Button } from "../../components/buttons/Button";
import { StatusBadge } from "../../components/StatusBadge";
import type { PlayerColor, Player } from "../../types/chess";

function Play() {
  const { sendMessage, lastMessage, isConnected } = useWebSocket();

  const [gameId, setGameId] = useState<string | null>(null);
  const [status, setStatus] = useState<'online' | 'disconnected' | 'waiting' | 'playing'>('online');
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>("white");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      setStatus("online");
    } else {
      setStatus("disconnected");
    }
  }, [isConnected]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.action === "startGame") {
      setGameId(lastMessage.gameId);
      setPlayerColor(lastMessage.color);
      setCurrentTurn(lastMessage.turn);
      setStatus("playing");
    }
    if (lastMessage.action === "players") {
      console.log("received players" + lastMessage);
      setPlayers(lastMessage.players);
      setPlayerId(lastMessage.playerId);
    }
  }, [lastMessage]);

  const onPlay = () => {
    if (gameId) {
      console.log("Already Playing");
      return;
    }
    if (isConnected) {
      sendMessage({ action: "play" });
      setStatus("waiting");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Chess Live</h2>
      <div style={{ marginBottom: 16 }}>
        <StatusBadge status={status} />
      </div>
      {!gameId && <Button onClick={onPlay}>Play</Button>}
      <div style={{ display: "flex", gap: 20 }}>
        <Board
          gameId={gameId}
          playerColor={playerColor}
          initialTurn={currentTurn}
        />
        {!gameId && <Players players={players} currentPlayerId={playerId ?? undefined} />}
      </div>
      {gameId && <Chat gameId={gameId} />}
    </div>
  );
}

export default Play;
