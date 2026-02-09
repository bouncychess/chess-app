import { useState } from "react";
import { theme } from "../../config/theme";
import { Button } from "../buttons/Button";

interface GameControlsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  isGameOver: boolean;
  hasOfferedDraw: boolean;
  hasPendingDrawOffer: boolean;
}

export function GameControls({
  onResign,
  onOfferDraw,
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

  const drawButtonDisabled = hasOfferedDraw || hasPendingDrawOffer;

  return (
    <div
      style={{
        ...theme.card,
        display: "flex",
        gap: 12,
        padding: 12,
        alignItems: "center",
      }}
    >
      {showResignConfirm ? (
        <>
          <span
            style={{
              fontSize: "0.875rem",
              color: theme.colors.text,
              marginRight: 8,
            }}
          >
            Resign?
          </span>
          <Button variant="danger" onClick={handleResignClick}>
            Confirm
          </Button>
          <Button variant="secondary" onClick={handleCancelResign}>
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Button variant="danger" onClick={handleResignClick}>
            Resign
          </Button>
          <Button
            variant="secondary"
            onClick={onOfferDraw}
            disabled={drawButtonDisabled}
          >
            {hasOfferedDraw ? "Draw Offered" : "Offer Draw"}
          </Button>
        </>
      )}
    </div>
  );
}
