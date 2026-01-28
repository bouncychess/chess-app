import { useEffect, useRef, useState } from "react";
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
  const { sendMessage, lastMessage, isConnected } = useWebSocket();

  // Initialize from navigation state
  const initialState = location.state as GameState | null;
  const [playerColor, setPlayerColor] = useState<PlayerColor>(initialState?.playerColor ?? "white");
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>(initialState?.currentTurn ?? "white");
  const [whiteTime, setWhiteTime] = useState<number>(initialState?.whiteTime ?? 180000);
  const [blackTime, setBlackTime] = useState<number>(initialState?.blackTime ?? 180000);
  const [whiteUsername, setWhiteUsername] = useState<string | null>(initialState?.whiteUsername ?? null);
  const [blackUsername, setBlackUsername] = useState<string | null>(initialState?.blackUsername ?? null);
  const [increment, setIncrement] = useState<number>(initialState?.increment ?? 0);
  const [pgn, setPgn] = useState<string | null>(null);
  const [status, setStatus] = useState<'online' | 'disconnected' | 'playing' | 'loading'>('loading');
  const hasRequestedGameState = useRef(false);

  // Always request fresh game state from server when connected
  useEffect(() => {
    if (isConnected && gameId && !hasRequestedGameState.current) {
      hasRequestedGameState.current = true;
      sendMessage({ action: "getGameState", gameId });
    }
  }, [isConnected, gameId, sendMessage]);

  const handleTurnChange = (newTurn: PlayerColor) => {
    setCurrentTurn(newTurn);
    if (newTurn === "black") {
      setWhiteTime(prev => prev + increment);
    } else {
      setBlackTime(prev => prev + increment);
    }
  };

  useEffect(() => {
    if (!isConnected && status === "playing") {
      setStatus("disconnected");
    } else if (isConnected && status === "disconnected") {
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

    // Handle gameState response when loading game directly
    if (lastMessage.action === "gameState" && lastMessage.gameId === gameId) {
      setPlayerColor(lastMessage.playerColor);
      setCurrentTurn(lastMessage.currentTurn);
      setWhiteTime(lastMessage.whiteTime);
      setBlackTime(lastMessage.blackTime);
      setWhiteUsername(lastMessage.whiteUsername);
      setBlackUsername(lastMessage.blackUsername);
      setIncrement(lastMessage.increment ?? 0);
      setPgn(lastMessage.pgn ?? null);
      setStatus("playing");
    }
  }, [lastMessage, gameId]);

  // Client-side clock countdown using actual elapsed time
  useEffect(() => {
    if (status !== "playing") return;

    let lastTick = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTick;
      lastTick = now;

      if (currentTurn === "white") {
        setWhiteTime(prev => Math.max(0, prev - elapsed));
      } else {
        setBlackTime(prev => Math.max(0, prev - elapsed));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [status, currentTurn]);

  if (!gameId) {
    return <div style={{ padding: 20 }}>Invalid game ID</div>;
  }

  if (status === "loading") {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <StatusBadge status={status} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
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
            initialPgn={pgn}
            onTurnChange={handleTurnChange}
          />
        </GameClock>
      </div>
      <Chat gameId={gameId} />
    </div>
  );
}

export default Game;
