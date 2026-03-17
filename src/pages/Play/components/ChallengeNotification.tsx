import { theme } from "../../../config/theme";
import { Button } from "../../../components/buttons/Button";

interface ChallengeNotificationProps {
  challengerUsername: string;
  timeControl: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function ChallengeNotification({
  challengerUsername,
  timeControl,
  onAccept,
  onDecline,
}: ChallengeNotificationProps) {
  return (
    <div
      style={{
        ...theme.card,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
          {challengerUsername}
        </div>
        <div style={{ color: theme.colors.placeholder, fontSize: "0.875rem" }}>
          challenges you to a game ({timeControl})
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="success" size="sm" onClick={onAccept}>
          Accept
        </Button>
        <Button variant="danger" size="sm" onClick={onDecline}>
          Decline
        </Button>
      </div>
    </div>
  );
}
