import type { Player } from "../../../types/chess";
import { theme } from "../../../config/theme";
import { ResizableCard } from "../../../components/ResizableCard";

interface PlayersProps {
  players: Player[];
  currentUsername?: string;
}

function Players({ players, currentUsername }: PlayersProps) {
  return (
    <ResizableCard initialWidth={300} minWidth={200} maxWidth={400}>
      <h3 style={theme.cardHeader}>Online Players</h3>
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
    </ResizableCard>
  );
}

export default Players;
