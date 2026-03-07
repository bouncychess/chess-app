// Used in previous layout where GameEndDisplay rendered title/subtitle in a ResizableCard
// import { theme } from "../../config/theme";
// import { ResizableCard } from "../ResizableCard";
import { Button } from "../buttons/Button";
import type { GameResult, GameEndReason } from "../../types/chess";

interface GameEndDisplayProps {
  gameResult: GameResult;
  gameEndReason: GameEndReason;
  onRematch?: () => void;
  onNewGame?: () => void;
  isPlayer?: boolean;
  hasOfferedRematch?: boolean;
  opponentOfferedRematch?: boolean;
  isWaitingNewGame?: boolean;
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
}: GameEndDisplayProps) {
  if (!isPlayer) return null;

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
        disabled={hasOfferedRematch}
      >
        {hasOfferedRematch ? "Rematch Offered" : "Rematch"}
      </Button>
    );
  };

  // Previous layout: title/subtitle displayed above buttons in a ResizableCard.
  // Now game end message is shown in Chat as a system message instead.
  // return (
  //   <ResizableCard style={{ textAlign: "center" }}>
  //     <div style={{ fontSize: "1.1rem", fontWeight: 600, color: theme.colors.text }}>
  //       {formatGameEndMessage(gameResult, gameEndReason).title}
  //     </div>
  //     <div style={{ fontSize: "0.875rem", color: theme.colors.placeholder, marginBottom: 12 }}>
  //       {formatGameEndMessage(gameResult, gameEndReason).subtitle}
  //     </div>
  //     <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
  //       {getRematchButton()}
  //       <Button variant="primary" onClick={onNewGame}>
  //         {isWaitingNewGame ? "Waiting..." : "New Game"}
  //       </Button>
  //     </div>
  //   </ResizableCard>
  // );

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
    </div>
  );
}
