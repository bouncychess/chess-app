import type { Player } from "../../../types/chess";

interface PlayersProps {
  players: Player[];
}

function Players({ players }: PlayersProps) {
  return (
    <div style={{ minWidth: 150, padding: 12, border: "1px solid #ccc", borderRadius: 4 }}>
      <h3 style={{ margin: "0 0 12px 0" }}>Online Players</h3>
      {players.length === 0 ? (
        <p style={{ color: "#888" }}>No players online</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {players.map((player) => (
            <li key={player.id} style={{ padding: "4px 0", display: "flex", justifyContent: "space-between" }}>
              <span>{player.name}</span>
              <span style={{ color: "#888", fontSize: "0.9em" }}>{player.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Players;
