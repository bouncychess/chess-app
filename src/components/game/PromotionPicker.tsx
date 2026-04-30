import { createElement } from "react";
import { useTheme } from "../../context/ThemeContext";
import type { PlayerColor } from "../../types/chess";

type PromotionPiece = "q" | "r" | "b" | "n";

interface PromotionPickerProps {
  // Destination square of the promoting move (e.g. "e8" or "h1"). Drives both
  // the column the picker sits on and the rank that determines piece color.
  destSquare: string;
  // Color shown at the bottom of the board from the viewer's perspective.
  orientation: PlayerColor;
  onSelect: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

const ROLE: Record<PromotionPiece, string> = {
  q: "queen",
  n: "knight",
  r: "rook",
  b: "bishop",
};

export default function PromotionPicker({ destSquare, orientation, onSelect, onCancel }: PromotionPickerProps) {
  const { theme, mode } = useTheme();

  const fileIdx = destSquare.charCodeAt(0) - "a".charCodeAt(0);
  const destRank = Number(destSquare[1]);
  // The pawn's color is determined by the destination rank: rank 8 means a
  // white pawn just arrived; rank 1 means black.
  const pieceColor: PlayerColor = destRank === 8 ? "white" : "black";

  // Translate the dest square into the viewer's grid (0..7, top-left origin).
  const showWhitePov = orientation === "white";
  const col = showWhitePov ? fileIdx : 7 - fileIdx;
  const destRow = showWhitePov ? 8 - destRank : destRank - 1;

  // Extend the picker toward the board interior so it never spills over the
  // board edge. Queen sits on the dest cell (closest to the pawn) and bishop
  // is farthest.
  const extendDown = destRow === 0;
  const piecesOrdered: PromotionPiece[] = extendDown ? ["q", "n", "r", "b"] : ["b", "r", "n", "q"];

  const left = `${col * 12.5}%`;
  const top = extendDown ? "0%" : "50%";

  const isWindows = mode === "windows";
  const panelShadow = isWindows
    ? theme.card.boxShadow
    : "0 6px 20px rgba(0, 0, 0, 0.35)";
  const panelRadius = isWindows ? 0 : 8;

  return (
    <div
      data-testid="promotion-picker"
      onClick={onCancel}
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left,
          top,
          width: "12.5%",
          height: "50%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.colors.cardBackground,
          boxShadow: panelShadow,
          borderRadius: panelRadius,
          overflow: "hidden",
        }}
      >
        {piecesOrdered.map((piece) => (
          <button
            key={piece}
            data-testid={`promotion-piece-${piece}`}
            onClick={() => onSelect(piece)}
            style={{
              flex: 1,
              padding: 0,
              border: "none",
              borderRadius: 0,
              backgroundColor: "transparent",
              cursor: "pointer",
              position: "relative",
              transition: "background-color 0.1s",
              boxShadow: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.squareHighlight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {/* `cg-wrap` activates the cburnett piece-sprite CSS rules; inline
                styles override the base 12.5% sizing so the sprite fills the
                button. Renders the same piece artwork that's on the board. */}
            <div className="cg-wrap" style={{ position: "absolute", inset: 0 }}>
              {createElement("piece", {
                className: `${pieceColor} ${ROLE[piece]}`,
                style: {
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                },
              })}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export type { PromotionPiece };
