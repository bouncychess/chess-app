import { useState } from "react";
import { theme } from "../../config/theme";
import { Button } from "../buttons/Button";

interface GameControlsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
  isGameOver: boolean;
  hasOfferedDraw: boolean;
  hasPendingDrawOffer: boolean;
}

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
        gap: 12,
        alignItems: "center",
        flexWrap: "nowrap",
      }}
    >
      {showResignConfirm ? (
        <>
          <span style={{ fontSize: "1rem", color: theme.colors.text }}>
            Resign?
          </span>
          <Button variant="danger" onClick={handleResignClick}>
            Yes
          </Button>
          <Button variant="secondary" onClick={handleCancelResign}>
            No
          </Button>
        </>
      ) : (
        <>
          <Button variant="danger" onClick={handleResignClick}>
            Resign
          </Button>
          {hasPendingDrawOffer ? (
            <>
              <span style={{ fontSize: "1rem", color: theme.colors.text }}>
                Draw?
              </span>
              <Button variant="success" onClick={onAcceptDraw} title="Accept draw">
                ✓
              </Button>
              <Button variant="danger" onClick={onDeclineDraw} title="Decline draw">
                ✗
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={onOfferDraw} disabled={hasOfferedDraw}>
              {hasOfferedDraw ? "Draw Offered" : "Offer Draw"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
