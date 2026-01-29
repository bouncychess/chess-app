import { theme } from "../../config/theme";

interface MoveNotationProps {
  pgn: string;
}

interface ParsedMove {
  moveNumber: number;
  white: string;
  black: string | null;
}

function parsePgn(pgn: string): ParsedMove[] {
  const movesOnly = pgn.replace(/\[[^\]]*\]/g, "").trim();
  if (!movesOnly) return [];

  const moveRegex = /(\d+)\.\s*(\S+)(?:\s+(\S+))?/g;
  const moves: ParsedMove[] = [];
  let match;

  while ((match = moveRegex.exec(movesOnly)) !== null) {
    moves.push({
      moveNumber: parseInt(match[1]),
      white: match[2],
      black: match[3] || null,
    });
  }

  return moves;
}

export function MoveNotation({ pgn }: MoveNotationProps) {
  const moves = parsePgn(pgn);

  return (
    <div
      style={{
        backgroundColor: theme.colors.cardBackground,
        borderRadius: 8,
        padding: 16,
        width: 200,
        maxHeight: 400,
        overflowY: "auto",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: "1rem",
          color: theme.colors.text,
        }}
      >
        Moves
      </h3>
      {moves.length === 0 ? (
        <p style={{ color: theme.colors.placeholder, fontSize: "0.875rem", margin: 0 }}>
          No moves yet
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {moves.map((move) => (
            <div
              key={move.moveNumber}
              style={{
                display: "flex",
                fontSize: "0.875rem",
                color: theme.colors.text,
              }}
            >
              <span style={{ width: 28, color: theme.colors.placeholder }}>
                {move.moveNumber}.
              </span>
              <span style={{ width: 50 }}>{move.white}</span>
              <span style={{ width: 50 }}>{move.black || ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
