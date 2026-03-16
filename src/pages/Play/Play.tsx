import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../../context/WebSocketContext";
import { useTheme } from "../../context/ThemeContext";
import Board from "../../components/game/Board";
import Players from "./components/Players";
import { GameClock } from "../../components/game/GameClock";
import { TimeControlSelector } from "./components/TimeControlSelector";
import { DEFAULT_TIME_CONTROL, TIME_CONTROLS } from "../../constants/timeControls";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { Button } from "../../components/buttons/Button";
import type { Player } from "../../types/chess";

function Play() {
  const navigate = useNavigate();
  const { sendMessage, subscribe, isConnected, username } = useWebSocket();
  const { mode } = useTheme();
  const panelOffset = mode === 'windows' ? 67 : 85;

  const [status, setStatus] = useState<'online' | 'disconnected' | 'waiting'>('online');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTimeControl, setSelectedTimeControl] = useLocalStorage({
    key: "selectedTimeControl",
    defaultValue: DEFAULT_TIME_CONTROL,
    serialize: (tc) => tc.label,
    deserialize: (s) => TIME_CONTROLS.find(tc => tc.label === s),
  });
  const [previewTime, setPreviewTime] = useState<number>(selectedTimeControl.initialTime);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (status !== "waiting") return;
    setDots(1);
    const interval = setInterval(() => setDots(d => (d % 3) + 1), 500);
    return () => clearInterval(interval);
  }, [status]);

  const [boardSize, setBoardSize] = useState(400);
  const [flipped, setFlipped] = useState(false);
  const hasRequestedPlayers = useRef(false);

  // Keyboard shortcut to flip board
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key === "f") {
        setFlipped(f => !f);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const selectedTimeControlRef = useRef(selectedTimeControl);
  useEffect(() => { selectedTimeControlRef.current = selectedTimeControl; }, [selectedTimeControl]);

  useEffect(() => {
    return subscribe((msg) => {
      if (msg.action === "startGame") {
        console.log("startGame received, navigating to game:", msg);
        navigate(`/game/${msg.gameId}`, {
          state: {
            playerColor: msg.color,
            currentTurn: msg.turn || "white",
            whiteTime: msg.whiteTime,
            blackTime: msg.blackTime,
            whiteUsername: msg.whiteUsername,
            blackUsername: msg.blackUsername,
            increment: selectedTimeControlRef.current.increment,
          }
        });
      }

      if (msg.action === "players") {
        setPlayers(msg.players);
      }
    });
  }, [subscribe, navigate]);

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

  const onCancelPlay = () => {
    if (isConnected) {
      sendMessage({ action: "play", cancel: true });
      setStatus("online");
    }
  };

  const onPlayBot = (botUsername: string) => {
    if (isConnected && selectedTimeControl) {
      sendMessage({
        action: "playBot",
        botUsername,
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <GameClock
          whiteTime={previewTime}
          blackTime={previewTime}
          whiteName={null}
          blackName={null}
          activeColor={null}
          playerColor="white"
          onFlip={() => setFlipped(f => !f)}
          flipped={flipped}
        >
          <Board
            gameId={null}
            playerColor="white"
            initialTurn="white"
            onTurnChange={() => {}}
            onSizeChange={setBoardSize}
            flipped={flipped}
          />
        </GameClock>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, height: boardSize + panelOffset }}>
          <TimeControlSelector
            selected={selectedTimeControl}
            onSelect={(tc) => {
              setSelectedTimeControl(tc);
              setPreviewTime(tc.initialTime);
              if (status === "waiting") {
                sendMessage({
                  action: "play",
                  timeControl: {
                    initialTime: tc.initialTime,
                    increment: tc.increment,
                  },
                });
              }
            }}
          />
          <Button variant="danger" onClick={status === "waiting" ? onCancelPlay : onPlay} disabled={!selectedTimeControl}>
            {status === "waiting"
              ? <span style={{ display: "flex", alignItems: "center", width: "100%", position: "relative" }}><span style={{ flex: 1, textAlign: "center" }}>Waiting{".".repeat(dots)}<span style={{ visibility: "hidden" }}>{".".repeat(3 - dots)}</span></span><span style={{ fontWeight: 900, fontSize: "1.0em", position: "absolute", right: 0 }}>✕</span></span>
              : "Play"}
          </Button>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Players players={players} currentUsername={username ?? undefined} onPlayBot={onPlayBot} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Play;
