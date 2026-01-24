import { useEffect, useState } from "react";
import { useWebSocket } from "../../context/WebSocketContext";
import Board from "./components/Board";
import Chat from "./components/Chat";
import Players from "./components/Players";
import { GameClock } from "./components/GameClock";
import { TimeControlSelector, DEFAULT_TIME_CONTROL } from "./components/TimeControlSelector";
import { Button } from "../../components/buttons/Button";
import { StatusBadge } from "../../components/StatusBadge";
import type { PlayerColor, Player, TimeControl } from "../../types/chess";

function Play() {
  const { sendMessage, lastMessage, isConnected } = useWebSocket();

  const [gameId, setGameId] = useState<string | null>(null);
  const [status, setStatus] = useState<'online' | 'disconnected' | 'waiting' | 'playing'>('online');
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>("white");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const [whiteTime, setWhiteTime] = useState<number>(3 * 60 * 1000);
  const [blackTime, setBlackTime] = useState<number>(3 * 60 * 1000);
  const handleTurnChange = (newTurn: PlayerColor) => {
    setCurrentTurn(newTurn);
    (newTurn === "black" ? setWhiteTime : setBlackTime)(prev => prev + (selectedTimeControl?.increment ?? 0));
  };
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
    // Reconnect is going to need full game state (clock, moves, chat)
    if (lastMessage.action === "clockSync") {
      setWhiteTime(lastMessage.whiteTime);
      setBlackTime(lastMessage.blackTime);
    }
    if (lastMessage.action === "players") {
      console.log("received players" + lastMessage);
      setPlayers(lastMessage.players);
      setPlayerId(lastMessage.playerId);
    }
  }, [lastMessage]);

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

  const onPlay = () => {
    if (gameId) {
      console.log("Already Playing");
      return;
    }
    if (isConnected && selectedTimeControl) {
      sendMessage({
        action: "play",
        timeControl: {
          initialTime: selectedTimeControl.initialTime,
          increment: selectedTimeControl.increment,
        },
      });
      setWhiteTime(selectedTimeControl.initialTime);
      setBlackTime(selectedTimeControl.initialTime);
      setStatus("waiting");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Chess Live</h2>
      <div style={{ marginBottom: 16 }}>
        <StatusBadge status={status} />
      </div>
      {!gameId && (
        <div style={{ marginBottom: 20 }}>
          <TimeControlSelector
            selected={selectedTimeControl}
            onSelect={(tc) => {
              setSelectedTimeControl(tc);
              setWhiteTime(tc.initialTime);
              setBlackTime(tc.initialTime);
            }}
          />
          <Button onClick={onPlay} disabled={!selectedTimeControl}>Play</Button>
        </div>
      )}
      <div style={{ display: "flex", gap: 20 }}>
        <GameClock
          whiteTime={whiteTime}
          blackTime={blackTime}
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
        {!gameId && <Players players={players} currentPlayerId={playerId ?? undefined} />}
      </div>
      {gameId && <Chat gameId={gameId} />}
    </div>
  );
}

export default Play;
