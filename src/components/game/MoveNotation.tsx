import { useEffect, useRef } from "react";
import { theme } from "../../config/theme";
import { ResizableCard } from "../ResizableCard";

interface MoveNotationProps {
  pgn: string;
  viewedMoveIndex?: number | null;
  onMoveClick?: (moveIndex: number) => void;
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
  onMoveClick,
}: MoveNotationProps) {
  const moves = parsePgn(pgn);
  const moveRowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected move when viewedMoveIndex changes
  useEffect(() => {
    if (viewedMoveIndex === null || viewedMoveIndex < 0) return;
    const container = containerRef.current;
    if (!container) return;

    // Calculate which row contains this move (each row has 2 half-moves)
    const rowNumber = Math.floor(viewedMoveIndex / 2) + 1;
    const rowElement = moveRowRefs.current.get(rowNumber);
    if (rowElement) {
      // Scroll within container only
      const rowTop = rowElement.offsetTop - container.offsetTop;
      const rowHeight = rowElement.offsetHeight;
      const containerHeight = container.clientHeight;
      const targetScroll = rowTop - (containerHeight / 2) + (rowHeight / 2);
      container.scrollTop = Math.max(0, targetScroll);
    }
  }, [viewedMoveIndex]);

  return (
    <ResizableCard
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <h3 style={{ ...theme.cardHeader, flexShrink: 0 }}>
        Moves
      </h3>
      {moves.length === 0 ? (
        <p style={{ color: theme.colors.placeholder, fontSize: "0.875rem", margin: 0 }}>
          No moves yet
        </p>
      ) : (
        <div
          ref={containerRef}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            flex: 1,
            overflowY: "auto",
            scrollBehavior: "smooth",
          }}
        >
          {moves.map((move) => {
            const whiteIndex = getMoveHalfIndex(move.moveNumber, false);
            const blackIndex = getMoveHalfIndex(move.moveNumber, true);
            const isWhiteSelected = viewedMoveIndex === whiteIndex;
            const isBlackSelected = move.black && viewedMoveIndex === blackIndex;

            return (
              <div
                key={move.moveNumber}
                ref={(el) => {
                  if (el) moveRowRefs.current.set(move.moveNumber, el);
                }}
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
                    backgroundColor: isWhiteSelected ? theme.colors.secondary : "transparent",
                    color: isWhiteSelected ? theme.colors.secondaryText : theme.colors.text,
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
                      backgroundColor: isBlackSelected ? theme.colors.secondary : "transparent",
                      color: isBlackSelected ? theme.colors.secondaryText : theme.colors.text,
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
    </ResizableCard>
  );
}
