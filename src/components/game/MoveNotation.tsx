import { theme } from "../../config/theme";

interface MoveNotationProps {
  pgn: string;
  viewedMoveIndex?: number | null;
  totalMoveCount?: number;
  onMoveClick?: (moveIndex: number) => void;
  onGoToLive?: () => void;
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

// Convert move number + color to half-move index
// Move 1 white = 0, Move 1 black = 1, Move 2 white = 2, etc.
function getMoveHalfIndex(moveNumber: number, isBlack: boolean): number {
  return (moveNumber - 1) * 2 + (isBlack ? 1 : 0);
}

export function MoveNotation({
  pgn,
  viewedMoveIndex = null,
  totalMoveCount = 0,
  onMoveClick,
  onGoToLive,
}: MoveNotationProps) {
  const moves = parsePgn(pgn);
  const isViewingHistory = viewedMoveIndex !== null;

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
        display: "flex",
        flexDirection: "column",
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
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {moves.map((move) => {
            const whiteIndex = getMoveHalfIndex(move.moveNumber, false);
            const blackIndex = getMoveHalfIndex(move.moveNumber, true);
            const isWhiteSelected = viewedMoveIndex === whiteIndex;
            const isBlackSelected = move.black && viewedMoveIndex === blackIndex;

            return (
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
                <span
                  onClick={() => onMoveClick?.(whiteIndex)}
                  style={{
                    width: 50,
                    cursor: "pointer",
                    backgroundColor: isWhiteSelected ? theme.colors.borderFocus : "transparent",
                    color: isWhiteSelected ? "#fff" : theme.colors.text,
                    borderRadius: 2,
                    padding: "0 4px",
                    marginRight: 2,
                  }}
                >
                  {move.white}
                </span>
                {move.black && (
                  <span
                    onClick={() => onMoveClick?.(blackIndex)}
                    style={{
                      width: 50,
                      cursor: "pointer",
                      backgroundColor: isBlackSelected ? theme.colors.borderFocus : "transparent",
                      color: isBlackSelected ? "#fff" : theme.colors.text,
                      borderRadius: 2,
                      padding: "0 4px",
                    }}
                  >
                    {move.black}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {totalMoveCount > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button
            onClick={() => {
              if (viewedMoveIndex === null) {
                onMoveClick?.(totalMoveCount - 1);
              } else if (viewedMoveIndex > 0) {
                onMoveClick?.(viewedMoveIndex - 1);
              } else if (viewedMoveIndex === 0) {
                onMoveClick?.(-1);
              }
            }}
            disabled={viewedMoveIndex === -1}
            style={{
              padding: "4px 12px",
              backgroundColor: theme.colors.secondary,
              color: theme.colors.secondaryText,
              border: "none",
              borderRadius: 4,
              cursor: viewedMoveIndex === -1 ? "not-allowed" : "pointer",
              opacity: viewedMoveIndex === -1 ? 0.5 : 1,
            }}
          >
            &lt;
          </button>
          <button
            onClick={() => {
              if (viewedMoveIndex === null) return;
              if (viewedMoveIndex >= totalMoveCount - 1) {
                onGoToLive?.();
              } else {
                onMoveClick?.(viewedMoveIndex + 1);
              }
            }}
            disabled={viewedMoveIndex === null}
            style={{
              padding: "4px 12px",
              backgroundColor: theme.colors.secondary,
              color: theme.colors.secondaryText,
              border: "none",
              borderRadius: 4,
              cursor: viewedMoveIndex === null ? "not-allowed" : "pointer",
              opacity: viewedMoveIndex === null ? 0.5 : 1,
            }}
          >
            &gt;
          </button>
        </div>
      )}
      {isViewingHistory && onGoToLive && (
        <button
          onClick={onGoToLive}
          style={{
            marginTop: 8,
            width: "100%",
            padding: "8px",
            backgroundColor: theme.colors.borderFocus,
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Go to Live
        </button>
      )}
    </div>
  );
}
