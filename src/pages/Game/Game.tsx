import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useWebSocket } from "../../context/WebSocketContext";
import Board from "../../components/game/Board";
import Chat from "./components/Chat";
import { GameClock } from "../../components/game/GameClock";
import { StatusBadge } from "../../components/StatusBadge";
import type { PlayerColor } from "../../types/chess";

interface GameState {
  playerColor: PlayerColor;
  currentTurn: PlayerColor;
  whiteTime: number;
  blackTime: number;
  whiteUsername: string | null;
  blackUsername: string | null;
  increment: number;
}

function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const { lastMessage, isConnected } = useWebSocket();

  // Initialize from navigation state
  const initialState = location.state as GameState | null;
  const [playerColor, setPlayerColor] = useState<PlayerColor>(initialState?.playerColor ?? "white");
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>(initialState?.currentTurn ?? "white");
  const [whiteTime, setWhiteTime] = useState<number>(initialState?.whiteTime ?? 180000);
  const [blackTime, setBlackTime] = useState<number>(initialState?.blackTime ?? 180000);
  const [whiteUsername, setWhiteUsername] = useState<string | null>(initialState?.whiteUsername ?? null);
  const [blackUsername, setBlackUsername] = useState<string | null>(initialState?.blackUsername ?? null);
  const [increment] = useState<number>(initialState?.increment ?? 0);
  const [status, setStatus] = useState<'online' | 'disconnected' | 'playing'>(initialState ? 'playing' : 'online');

  const handleTurnChange = (newTurn: PlayerColor) => {
    setCurrentTurn(newTurn);
    if (newTurn === "black") {
      setWhiteTime(prev => prev + increment);
    } else {
      setBlackTime(prev => prev + increment);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      setStatus("disconnected");
    } else if (status === "disconnected") {
      setStatus("playing");
    }
  }, [isConnected, status]);

  useEffect(() => {
    if (!lastMessage) return;

    // Handle startGame in case user navigates directly to game URL
    if (lastMessage.action === "startGame" && lastMessage.gameId === gameId) {
      setPlayerColor(lastMessage.color);
      setCurrentTurn(lastMessage.turn || "white");
      setWhiteUsername(lastMessage.whiteUsername);
      setBlackUsername(lastMessage.blackUsername);
      setStatus("playing");
      if (lastMessage.whiteTime !== undefined) {
        setWhiteTime(lastMessage.whiteTime);
        setBlackTime(lastMessage.blackTime);
      }
    }

    if (lastMessage.action === "move") {
      if (lastMessage.turn) {
        handleTurnChange(lastMessage.turn);
      }
      if (lastMessage.whiteTime !== undefined) {
        setWhiteTime(lastMessage.whiteTime);
        setBlackTime(lastMessage.blackTime);
      }
    }

    if (lastMessage.action === "clockSync") {
      setWhiteTime(lastMessage.whiteTime);
      setBlackTime(lastMessage.blackTime);
    }
  }, [lastMessage, gameId]);

  // Client-side clock countdown
  useEffect(() => {
    if (status !== "playing") return;

    const interval = setInterval(() => {
      if (currentTurn === "white") {
        setWhiteTime(prev => Math.max(0, prev - 100));
      } else {
        setBlackTime(prev => Math.max(0, prev - 100));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [status, currentTurn]);

  if (!gameId) {
    return <div style={{ padding: 20 }}>Invalid game ID</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Game</h2>
      <div style={{ marginBottom: 16 }}>
        <StatusBadge status={status} />
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        <GameClock
          whiteTime={whiteTime}
          blackTime={blackTime}
          whiteName={whiteUsername}
          blackName={blackUsername}
          activeColor={status === "playing" ? currentTurn : null}
          playerColor={playerColor}
        >
          <Board
            gameId={gameId}
            playerColor={playerColor}
            initialTurn={currentTurn}
            onTurnChange={handleTurnChange}
          />
        </GameClock>
      </div>
      <Chat gameId={gameId} />
    </div>
  );
}

export default Game;
