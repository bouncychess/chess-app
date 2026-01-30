import type { Player } from "../../../types/chess";
import { theme } from "../../../config/theme";

interface PlayersProps {
  players: Player[];
  currentUsername?: string;
}

function Players({ players, currentUsername }: PlayersProps) {
  return (
    <div style={{
      ...theme.card,
      minWidth: 200,
      maxWidth: 300,
      flex: "1 1 200px",
      boxSizing: "border-box",
    }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: theme.colors.text }}>Online Players</h3>
      {players.length === 0 ? (
        <p style={{ color: theme.colors.placeholder, fontSize: "0.875rem", margin: 0 }}>No players online</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 400, overflowY: "auto" }}>
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
              <span>{player.username}</span>
              <span style={{ color: theme.colors.placeholder }}>{player.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Players;
