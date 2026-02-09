import { theme } from "../../config/theme";
import { Button } from "../buttons/Button";

interface DrawOfferNotificationProps {
  offeredBy: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function DrawOfferNotification({
  offeredBy,
  onAccept,
  onDecline,
}: DrawOfferNotificationProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          ...theme.card,
          padding: 24,
          textAlign: "center",
          minWidth: 280,
        }}
      >
        <div
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: theme.colors.text,
            marginBottom: 8,
          }}
        >
          Draw Offered
        </div>
        <div
          style={{
            fontSize: "0.875rem",
            color: theme.colors.placeholder,
            marginBottom: 16,
          }}
        >
          {offeredBy} is offering a draw
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button variant="primary" onClick={onAccept}>
            Accept
          </Button>
          <Button variant="secondary" onClick={onDecline}>
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
