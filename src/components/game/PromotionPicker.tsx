import { theme } from "../../config/theme";
import type { PlayerColor } from "../../types/chess";

type PromotionPiece = "q" | "r" | "b" | "n";

interface PromotionPickerProps {
  playerColor: PlayerColor;
  onSelect: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

const pieceSymbols: Record<PlayerColor, Record<PromotionPiece, string>> = {
  white: { q: "♕", r: "♖", b: "♗", n: "♘" },
  black: { q: "♛", r: "♜", b: "♝", n: "♞" },
};

const promotionPieces: PromotionPiece[] = ["q", "r", "b", "n"];

export default function PromotionPicker({ playerColor, onSelect, onCancel }: PromotionPickerProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 8,
          backgroundColor: theme.colors.cardBackground,
          borderRadius: 6,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {promotionPieces.map((piece) => (
          <button
            key={piece}
            onClick={() => onSelect(piece)}
            style={{
              width: 40,
              height: 40,
              padding: 4,
              border: "none",
              borderRadius: 4,
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(91, 143, 185, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>
              {pieceSymbols[playerColor][piece]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export type { PromotionPiece };
