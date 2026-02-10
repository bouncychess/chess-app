import { theme } from "../../config/theme";
import type { GameResult, GameEndReason } from "../../types/chess";

interface GameEndDisplayProps {
  gameResult: GameResult;
  gameEndReason: GameEndReason;
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

function formatGameEndMessage(result: GameResult, reason: GameEndReason): { title: string; subtitle: string } {
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

export function GameEndDisplay({ gameResult, gameEndReason }: GameEndDisplayProps) {
  const { title, subtitle } = formatGameEndMessage(gameResult, gameEndReason);

  return (
    <div style={{
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.cardBackground,
      border: `1px solid ${theme.colors.border}`,
      textAlign: "center",
    }}>
      <div style={{
        fontWeight: 600,
        fontSize: "1rem",
        color: theme.colors.text,
        marginBottom: 4,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: "0.875rem",
        color: theme.colors.placeholder,
      }}>
        {subtitle}
      </div>
    </div>
  );
}
