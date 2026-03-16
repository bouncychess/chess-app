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
import ChallengeNotification from "./components/ChallengeNotification";
import type { Player } from "../../types/chess";

function Play() {
  const navigate = useNavigate();
  const { sendMessage, lastMessage, isConnected, username } = useWebSocket();
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
  const [pendingChallenge, setPendingChallenge] = useState<{ username: string; timeControl: string } | null>(null);
  const [challengesSent, setChallengesSent] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.action === "startGame") {
      // Cancel all outstanding challenges before navigating to game
      setChallengesSent((prev) => {
        prev.forEach((target) => {
          sendMessage({ action: "cancelChallenge", targetUsername: target });
        });
        return new Set();
      });
      setPendingChallenge(null);
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
      const self = lastMessage.players.find((p: Player) => p.username === username);
      if (self?.gameId) {
        navigate(`/game/${self.gameId}`);
      }
    }

    if (lastMessage.action === "challenge") {
      setPendingChallenge({
        username: lastMessage.challengerUsername,
        timeControl: lastMessage.timeControl,
      });
    }

    if (lastMessage.action === "challengeDeclined") {
      setChallengesSent((prev) => {
        const next = new Set(prev);
        next.delete(lastMessage.declinedBy);
        return next;
      });
    }

    if (lastMessage.action === "challengeCanceled") {
      setPendingChallenge(null);
    }
  }, [lastMessage, navigate, selectedTimeControl.increment, sendMessage]);

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

  const onChallenge = (targetUsername: string) => {
    if (!isConnected) return;
    if (challengesSent.has(targetUsername)) {
      // Cancel existing challenge
      sendMessage({ action: "cancelChallenge", targetUsername });
      setChallengesSent((prev) => {
        const next = new Set(prev);
        next.delete(targetUsername);
        return next;
      });
    } else if (selectedTimeControl) {
      // Send new challenge
      sendMessage({
        action: "challenge",
        targetUsername,
        timeControl: {
          initialTime: selectedTimeControl.initialTime,
          increment: selectedTimeControl.increment,
        },
      });
      setChallengesSent((prev) => new Set(prev).add(targetUsername));
    }
  };

  const onAcceptChallenge = () => {
    if (isConnected && pendingChallenge) {
      sendMessage({
        action: "respondChallenge",
        challengerUsername: pendingChallenge.username,
        accept: true,
      });
      setPendingChallenge(null);
    }
  };

  const onDeclineChallenge = () => {
    if (isConnected && pendingChallenge) {
      sendMessage({
        action: "respondChallenge",
        challengerUsername: pendingChallenge.username,
        accept: false,
      });
      setPendingChallenge(null);
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
          {pendingChallenge && (
            <ChallengeNotification
              challengerUsername={pendingChallenge.username}
              timeControl={pendingChallenge.timeControl}
              onAccept={onAcceptChallenge}
              onDecline={onDeclineChallenge}
            />
          )}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Players
              players={players}
              currentUsername={username ?? undefined}
              onPlayBot={onPlayBot}
              onChallenge={onChallenge}
              challengesSent={challengesSent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Play;
