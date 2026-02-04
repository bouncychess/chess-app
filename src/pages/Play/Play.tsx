import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../../context/WebSocketContext";
import Board from "../../components/game/Board";
import Players from "./components/Players";
import { GameClock } from "../../components/game/GameClock";
import { TimeControlSelector } from "./components/TimeControlSelector";
import { DEFAULT_TIME_CONTROL } from "../../constants/timeControls";
import { Button } from "../../components/buttons/Button";
import { DisconnectedOverlay } from "../../components/DisconnectedOverlay";
import type { Player, TimeControl } from "../../types/chess";

function Play() {
  const navigate = useNavigate();
  const { sendMessage, lastMessage, isConnected, username } = useWebSocket();

  const [status, setStatus] = useState<'online' | 'disconnected' | 'waiting'>('online');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const [previewTime, setPreviewTime] = useState<number>(DEFAULT_TIME_CONTROL.initialTime);
  const [boardSize, setBoardSize] = useState(400);
  const hasRequestedPlayers = useRef(false);

  // Request players list on mount and when connection changes
  useEffect(() => {
    if (isConnected) {
      setStatus("online");
      if (!hasRequestedPlayers.current) {
        hasRequestedPlayers.current = true;
        sendMessage({ action: "getPlayers" });
      }
    } else {
      setStatus("disconnected");
      hasRequestedPlayers.current = false;
    }
  }, [isConnected, sendMessage]);

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
    <div style={{ padding: 20, position: "relative" }}>
      <DisconnectedOverlay isDisconnected={!isConnected} />
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
            onSizeChange={setBoardSize}
          />
        </GameClock>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, height: boardSize + 85 }}>
          <TimeControlSelector
            selected={selectedTimeControl}
            onSelect={(tc) => {
              setSelectedTimeControl(tc);
              setPreviewTime(tc.initialTime);
            }}
          />
          <Button variant="danger" onClick={onPlay} disabled={!selectedTimeControl || status === "waiting"}>
            {status === "waiting" ? "Waiting for opponent..." : "Play"}
          </Button>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Players players={players} currentUsername={username ?? undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Play;
