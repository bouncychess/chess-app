import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../../context/WebSocketContext";
import Board from "../../components/game/Board";
import Players from "./components/Players";
import { GameClock } from "../../components/game/GameClock";
import { TimeControlSelector } from "./components/TimeControlSelector";
import { DEFAULT_TIME_CONTROL } from "../../constants/timeControls";
import { Button } from "../../components/buttons/Button";
import { StatusBadge } from "../../components/StatusBadge";
import type { Player, TimeControl } from "../../types/chess";

function Play() {
  const navigate = useNavigate();
  const { sendMessage, lastMessage, isConnected } = useWebSocket();

  const [status, setStatus] = useState<'online' | 'disconnected' | 'waiting'>('online');
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const [previewTime, setPreviewTime] = useState<number>(DEFAULT_TIME_CONTROL.initialTime);

  useEffect(() => {
    if (isConnected) {
      if (status === 'disconnected') {
        setStatus("online");
      }
    } else {
      setStatus("disconnected");
    }
  }, [isConnected, status]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.action === "startGame") {
      console.log("startGame received, navigating to game:", lastMessage);
      navigate(`/game/${lastMessage.gameId}`, {
        state: {
          playerColor: lastMessage.color,
          currentTurn: lastMessage.turn || "white",
          whiteTime: lastMessage.whiteTime,
          blackTime: lastMessage.blackTime,
          whiteUsername: lastMessage.whiteUsername,
          blackUsername: lastMessage.blackUsername,
          increment: selectedTimeControl.increment,
        }
      });
    }

    if (lastMessage.action === "players") {
      setPlayers(lastMessage.players);
      setPlayerId(lastMessage.playerId);
    }
  }, [lastMessage, navigate, selectedTimeControl.increment]);

  const onPlay = () => {
    if (isConnected && selectedTimeControl) {
      sendMessage({
        action: "play",
        timeControl: {
          initialTime: selectedTimeControl.initialTime,
          increment: selectedTimeControl.increment,
        },
      });
      setStatus("waiting");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <TimeControlSelector
          selected={selectedTimeControl}
          onSelect={(tc) => {
            setSelectedTimeControl(tc);
            setPreviewTime(tc.initialTime);
          }}
        />
        <Button onClick={onPlay} disabled={!selectedTimeControl || status === "waiting"}>
          {status === "waiting" ? "Waiting for opponent..." : "Play"}
        </Button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <GameClock
          whiteTime={previewTime}
          blackTime={previewTime}
          whiteName={null}
          blackName={null}
          activeColor={null}
          playerColor="white"
        >
          <Board
            gameId={null}
            playerColor="white"
            initialTurn="white"
            onTurnChange={() => {}}
          />
        </GameClock>
        <Players players={players} currentPlayerId={playerId ?? undefined} />
      </div>
    </div>
  );
}

export default Play;
