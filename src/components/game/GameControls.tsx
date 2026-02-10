import { useState } from "react";
import { theme } from "../../config/theme";

interface GameControlsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
  isGameOver: boolean;
  hasOfferedDraw: boolean;
  hasPendingDrawOffer: boolean;
}

const buttonBase = {
  padding: "4px 10px",
  borderRadius: 4,
  fontWeight: 600,
  fontSize: "0.75rem",
  cursor: "pointer",
  border: "none",
};

export function GameControls({
  onResign,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  isGameOver,
  hasOfferedDraw,
  hasPendingDrawOffer,
}: GameControlsProps) {
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  if (isGameOver) {
    return null;
  }

  const handleResignClick = () => {
    if (showResignConfirm) {
      onResign();
      setShowResignConfirm(false);
    } else {
      setShowResignConfirm(true);
    }
  };

  const handleCancelResign = () => {
    setShowResignConfirm(false);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {showResignConfirm ? (
        <>
          <span
            style={{
              fontSize: "0.75rem",
              color: theme.colors.text,
            }}
          >
            Resign?
          </span>
          <button
            onClick={handleResignClick}
            style={{
              ...buttonBase,
              backgroundColor: theme.colors.danger,
              color: theme.colors.dangerText,
            }}
          >
            Yes
          </button>
          <button
            onClick={handleCancelResign}
            style={{
              ...buttonBase,
              backgroundColor: theme.colors.secondary,
              color: theme.colors.secondaryText,
            }}
          >
            No
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handleResignClick}
            style={{
              ...buttonBase,
              backgroundColor: theme.colors.danger,
              color: theme.colors.dangerText,
            }}
          >
            Resign
          </button>
          {hasPendingDrawOffer ? (
            <>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: theme.colors.text,
                }}
              >
                Draw?
              </span>
              <button
                onClick={onAcceptDraw}
                style={{
                  ...buttonBase,
                  backgroundColor: "#22c55e",
                  color: "#ffffff",
                  padding: "4px 8px",
                }}
                title="Accept draw"
              >
                ✓
              </button>
              <button
                onClick={onDeclineDraw}
                style={{
                  ...buttonBase,
                  backgroundColor: theme.colors.danger,
                  color: theme.colors.dangerText,
                  padding: "4px 8px",
                }}
                title="Decline draw"
              >
                ✗
              </button>
            </>
          ) : (
            <button
              onClick={onOfferDraw}
              disabled={hasOfferedDraw}
              style={{
                ...buttonBase,
                backgroundColor: theme.colors.secondary,
                color: theme.colors.secondaryText,
                opacity: hasOfferedDraw ? 0.5 : 1,
                cursor: hasOfferedDraw ? "not-allowed" : "pointer",
              }}
            >
              {hasOfferedDraw ? "Draw Offered" : "Offer Draw"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
