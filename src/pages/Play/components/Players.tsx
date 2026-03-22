import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Player } from "../../../types/chess";
import { theme } from "../../../config/theme";
import { useTheme } from "../../../context/ThemeContext";
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

const CrossedSwordsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 512 472.178" fill="currentColor">
    <path d="M476.079 10.208l-48.678 105.717a7.269 7.269 0 01-1.801 2.393L310.365 219.249l74.965 81.314c6.784-2.789 13.816-4.524 20.824-5.189 16.697-1.586 33.257 2.898 46.096 13.656a5.408 5.408 0 01.633 8.188l-33.872 33.873 62.95 70.999c7.948-1.519 16.485.797 22.638 6.949 9.868 9.869 9.868 25.87 0 35.738-9.869 9.868-25.871 9.868-35.739 0a25.383 25.383 0 01-3.383-4.188l-.275.02c-3.468.225-6.874.522-10.533.841-16.808 1.474-38.32 3.354-51.495-1.179-8.702-2.991-15.775-7.738-21.3-14.132-5.425-6.283-9.216-14.003-11.459-23.058-1.38-5.576 2.022-11.221 7.598-12.602 5.576-1.38 11.221 2.024 12.601 7.598 1.455 5.876 3.762 10.71 6.97 14.424 3.11 3.598 7.22 6.317 12.38 8.089l42.865.143.329-9.611-62.131-52.047-31.748 31.748-.338.295a5.396 5.396 0 01-7.603-.633c-10.937-12.878-15.502-29.565-13.905-46.39.677-7.143 2.468-14.311 5.351-21.217l-86.785-76.011-86.783 76.011c2.882 6.906 4.674 14.074 5.351 21.217 1.597 16.825-2.969 33.512-13.905 46.39a5.396 5.396 0 01-7.603.633l-.33-.303-31.749-31.745-62.138 52.052.329 9.611 42.865-.143c5.16-1.772 9.27-4.491 12.38-8.089 3.208-3.714 5.515-8.548 6.97-14.424 1.38-5.574 7.025-8.978 12.601-7.598 5.576 1.381 8.977 7.026 7.597 12.602-2.242 9.055-6.033 16.775-11.458 23.058-5.525 6.394-12.598 11.141-21.301 14.132-13.174 4.533-34.686 2.653-51.494 1.179-3.659-.319-7.065-.616-10.533-.841l-.275-.02a25.434 25.434 0 01-3.383 4.188c-9.868 9.868-25.87 9.868-35.739 0-9.868-9.868-9.868-25.869 0-35.738 6.152-6.152 14.69-8.468 22.638-6.949l62.952-71.002-33.874-33.87a5.408 5.408 0 01.633-8.188c12.838-10.758 29.398-15.242 46.096-13.656 7.008.665 14.039 2.399 20.824 5.188l74.962-81.314L86.4 118.318a7.229 7.229 0 01-1.799-2.394L35.921 10.208A7.195 7.195 0 0145.712.781l106.324 47.593a7.173 7.173 0 012.359 1.695l101.602 110.207L357.599 50.064a7.323 7.323 0 012.365-1.69L466.288.781a7.195 7.195 0 019.791 9.427zM288.195 238.667l-1.66 1.454-6.476 5.674 67.424 65.473 7.517-7.73-66.805-64.871zm-62.43-45.597l5.318-5.769 1.992-2.161L118.827 74.198l-7.517 7.73L225.765 193.07zM409.874 72.999L166.923 308.93l-7.517-7.73L402.357 65.269l7.517 7.73z" />
  </svg>
);

const PixelCrossedSwordsIcon = () => (
  <img
    src="/images/icon_36.png"
    alt="Challenge"
    width={16}
    height={16}
    style={{ transform: "scaleY(-1)", imageRendering: "pixelated" }}
  />
);

const ChallengeIcon = ({ isWindows }: { isWindows: boolean }) => isWindows ? <PixelCrossedSwordsIcon /> : <CrossedSwordsIcon />;

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

function isProfileLinkable(username: string) {
  return !username.startsWith('Guest_') && !username.endsWith('_bot');
}

function Players({ players, currentUsername, onPlayBot, onChallenge, challengesSent = new Set() }: PlayersProps) {
  const { mode } = useTheme();
  const isWindows = mode === "windows";

  return (
    <ResizableCard style={{ height: "100%", display: "flex", flexDirection: "column", width: 250 }}>
      <h3 style={{ ...theme.cardHeader, flexShrink: 0 }}>Online Players</h3>
      {players.length === 0 ? (
        <p style={{ color: theme.colors.placeholder, fontSize: "0.875rem", margin: 0 }}>No players online</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: 1, overflowY: "auto" }}>
          {players.map((player) => {
            const canChallenge = !player.isBot && player.username !== currentUsername && player.status !== "playing" && onChallenge;
            const hasSentChallenge = challengesSent.has(player.username);

            return (
              <li key={player.username} style={{
                padding: "4px 8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: player.username === currentUsername ? "rgba(34, 197, 94, 0.3)" : "transparent",
                borderRadius: 4,
                fontSize: "0.875rem",
                color: theme.colors.text,
              }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {isProfileLinkable(player.username) ? (
                    <Link to={`/user/${player.username}`} style={{ color: theme.colors.link, textDecoration: "none" }}>
                      {player.username}
                    </Link>
                  ) : (
                    player.username
                  )}
                  {player.isBot && <BotIcon />}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {canChallenge && (
                    hasSentChallenge ? (
                      <ChallengeSentButton username={player.username} onChallenge={onChallenge} />
                    ) : (
                      <button
                        onClick={() => onChallenge(player.username)}
                        style={{
                          background: "none",
                          border: "none",
                          boxShadow: "none",
                          outline: "none",
                          padding: 2,
                          cursor: "pointer",
                          color: theme.colors.primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: 0.6,
                          transition: "opacity 0.15s",
                        }}
                        title="Challenge"
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                      >
                        <ChallengeIcon isWindows={isWindows} />
                      </button>
                    )
                  )}
                  {player.isBot && onPlayBot ? (
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
                  ) : player.gameId ? (
                    <Link to={`/game/${player.gameId}`} state={{ spectatingUsername: player.username }} style={{ color: theme.colors.link, textDecoration: "none" }}>
                      {player.status}
                    </Link>
                  ) : (
                    <span style={{ color: theme.colors.placeholder }}>
                      {player.status === "waiting" && player.timeControl
                        ? `waiting ${player.timeControl}`
                        : player.status}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </ResizableCard>
  );
}

export default Players;
