import { theme } from "../../config/theme";
import { Button } from "../buttons/Button";
import type { GameResult, GameEndReason, PlayerColor } from "../../types/chess";

interface GameEndDisplayProps {
  gameResult: GameResult;
  gameEndReason: GameEndReason;
  onRematch?: () => void;
  onNewGame?: () => void;
  isPlayer?: boolean;
  hasOfferedRematch?: boolean;
  opponentOfferedRematch?: boolean;
  isWaitingNewGame?: boolean;
  whiteRatingDelta?: number | null;
  blackRatingDelta?: number | null;
  playerColor?: PlayerColor;
}

function formatDelta(delta: number): string {
  const truncated = Math.trunc(delta);
  if (truncated > 0) return `+${truncated}`;
  return `${truncated}`;
}

const reasonLabels: Record<GameEndReason, string> = {
  checkmate: "by checkmate",
  resignation: "by resignation",
  timeout: "on time",
  stalemate: "by stalemate",
  insufficient_material: "by insufficient material",
  fifty_move_rule: "by fifty-move rule",
  threefold_repetition: "by threefold repetition",
  agreement: "by agreement",
};

export function formatGameEndMessage(result: GameResult, reason: GameEndReason): { title: string; subtitle: string } {
  if (reason === "resignation") {
    if (result === "white") {
      return { title: "Black resigned", subtitle: "White is victorious" };
    } else {
      return { title: "White resigned", subtitle: "Black is victorious" };
    }
  }
  if (reason === "agreement") {
    return { title: "Draw", subtitle: "by agreement" };
  }
  let title: string;
  if (result === "white") {
    title = "White wins";
  } else if (result === "black") {
    title = "Black wins";
  } else {
    title = "Draw";
  }
  return { title, subtitle: reasonLabels[reason] };
}

export function GameEndDisplay({
  onRematch,
  onNewGame,
  isPlayer = false,
  hasOfferedRematch = false,
  opponentOfferedRematch = false,
  isWaitingNewGame = false,
  whiteRatingDelta = null,
  blackRatingDelta = null,
  playerColor,
}: GameEndDisplayProps) {
  if (!isPlayer) return null;

  // Show only this player's own delta — they don't need both.
  const myDelta = playerColor === "white" ? whiteRatingDelta : blackRatingDelta;

  const getRematchButton = () => {
    if (opponentOfferedRematch) {
      return (
        <Button variant="success" onClick={onRematch}>
          Accept Rematch
        </Button>
      );
    }
    return (
      <Button
        variant="secondary"
        onClick={onRematch}
      >
        {hasOfferedRematch ? "Cancel Rematch" : "Rematch"}
      </Button>
    );
  };

  return (
    <div style={{
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "nowrap",
    }}>
      {getRematchButton()}
      <Button
        variant="primary"
        onClick={onNewGame}
      >
        {isWaitingNewGame ? "Waiting..." : "New Game"}
      </Button>
      {typeof myDelta === "number" && (
        <span style={{
          fontWeight: 600,
          color: myDelta > 0 ? theme.colors.success
               : myDelta < 0 ? theme.colors.danger
               : theme.colors.placeholder,
        }}>
          {formatDelta(myDelta)}
        </span>
      )}
    </div>
  );
}
