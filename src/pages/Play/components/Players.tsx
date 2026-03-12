import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Player } from "../../../types/chess";
import { theme } from "../../../config/theme";
import { ResizableCard } from "../../../components/ResizableCard";

function ChallengeSentButton({ username, onChallenge }: { username: string; onChallenge: (u: string) => void }) {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => setDots(d => (d % 3) + 1), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={() => onChallenge(username)}
      style={{
        background: theme.colors.placeholder,
        border: "none",
        borderRadius: 4,
        padding: "2px 8px",
        cursor: "pointer",
        color: theme.colors.primaryText,
        fontSize: "0.75rem",
        display: "flex",
        alignItems: "center",
        gap: 0,
        position: "relative",
        minWidth: 68,
      }}
    >
      <span style={{ flex: 1, textAlign: "center" }}>
        Sent{".".repeat(dots)}
        <span style={{ visibility: "hidden" }}>{".".repeat(3 - dots)}</span>
      </span>
      <span style={{ fontWeight: 900, fontSize: "0.75em", position: "absolute", right: 4 }}>✕</span>
    </button>
  );
}

const BotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.danger} strokeWidth="2" style={{ marginLeft: 4, flexShrink: 0 }}>
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <circle cx="8" cy="16" r="1" fill={theme.colors.danger} />
    <circle cx="16" cy="16" r="1" fill={theme.colors.danger} />
  </svg>
);

interface PlayersProps {
  players: Player[];
  currentUsername?: string;
  onPlayBot?: (botUsername: string) => void;
  onChallenge?: (username: string) => void;
  challengesSent?: Set<string>;
}

function Players({ players, currentUsername, onPlayBot, onChallenge, challengesSent = new Set() }: PlayersProps) {
  return (
    <ResizableCard style={{ height: "100%", display: "flex", flexDirection: "column", width: 250 }}>
      <h3 style={{ ...theme.cardHeader, flexShrink: 0 }}>Online Players</h3>
      {players.length === 0 ? (
        <p style={{ color: theme.colors.placeholder, fontSize: "0.875rem", margin: 0 }}>No players online</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: 1, overflowY: "auto" }}>
          {players.map((player) => (
            <li key={player.username} style={{
              padding: "4px 8px",
              display: "flex",
              justifyContent: "space-between",
              backgroundColor: player.username === currentUsername ? "rgba(34, 197, 94, 0.3)" : "transparent",
              borderRadius: 4,
              fontSize: "0.875rem",
              color: theme.colors.text,
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {player.username}
                {player.isBot && <BotIcon />}
              </span>
              {player.gameId ? (
                <Link to={`/game/${player.gameId}`} style={{ color: theme.colors.link, textDecoration: "none" }}>
                  {player.status}
                </Link>
              ) : player.isBot && onPlayBot ? (
                <button
                  onClick={() => onPlayBot(player.username)}
                  style={{
                    background: theme.colors.danger,
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: theme.colors.dangerText,
                    fontSize: "0.75rem",
                  }}
                >
                  Play
                </button>
              ) : !player.isBot && player.username !== currentUsername && player.status === "online" && onChallenge ? (
                challengesSent.has(player.username) ? (
                  <ChallengeSentButton username={player.username} onChallenge={onChallenge} />
                ) : (
                  <button
                    onClick={() => onChallenge(player.username)}
                    style={{
                      background: theme.colors.primary,
                      border: "none",
                      borderRadius: 4,
                      padding: "2px 8px",
                      cursor: "pointer",
                      color: theme.colors.primaryText,
                      fontSize: "0.75rem",
                    }}
                  >
                    Challenge
                  </button>
                )
              ) : (
                <span style={{ color: theme.colors.placeholder }}>
                  {player.status === "waiting" && player.timeControl
                    ? `waiting ${player.timeControl}`
                    : player.status}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </ResizableCard>
  );
}

export default Players;
