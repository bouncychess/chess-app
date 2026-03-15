import type { ReactNode } from "react";
import { Clock } from "./Clock";
import { theme } from "../../config/theme";
import type { PlayerColor } from "../../types/chess";

interface GameClockProps {
  whiteTime: number;
  blackTime: number;
  activeColor: PlayerColor | null;
  playerColor: PlayerColor;
  whiteName: string | null;
  blackName: string | null;
  children?: ReactNode;
  onFlip?: () => void;
  flipped?: boolean;
  boardSize?: number;
}

// Scale factor: 1.0 at 400px board, dampened so it doesn't grow too large
function getScale(boardSize: number) {
  const raw = boardSize / 400;
  return 0.7 + raw * 0.3;
}

function PlayerRow({ name, time, isActive, trailing, scale }: { name: string | null; time: number; isActive: boolean; trailing?: ReactNode; scale: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: `${0.85 * scale}rem`, fontWeight: 500 }}>{name || ""}</span>
      <div style={{ display: "flex", alignItems: "center", gap: Math.round(8 * scale) }}>
        {trailing}
        <Clock time={time} isActive={isActive} scale={scale} />
      </div>
    </div>
  );
}

export function GameClock({ whiteTime, blackTime, activeColor, playerColor, whiteName, blackName, children, onFlip, flipped = false, boardSize = 400 }: GameClockProps) {
  const scale = getScale(boardSize);

  // When flipped, swap which color appears on top/bottom
  const isPlayerWhite = flipped ? playerColor !== "white" : playerColor === "white";

  const topRow = isPlayerWhite ? (
    <PlayerRow name={blackName} time={blackTime} isActive={activeColor === "black"} scale={scale} />
  ) : (
    <PlayerRow name={whiteName} time={whiteTime} isActive={activeColor === "white"} scale={scale} />
  );

  const iconSize = Math.round(16 * scale);
  const flipButton = onFlip ? (
    <div
      onClick={onFlip}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.5,
        transition: "opacity 0.15s ease",
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}
      title="Flip board"
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
        <path d="M4 14V2M1 5l3-3 3 3" stroke={theme.colors.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 2v12M9 11l3 3 3-3" stroke={theme.colors.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  ) : undefined;

  const bottomRow = isPlayerWhite ? (
    <PlayerRow name={whiteName} time={whiteTime} isActive={activeColor === "white"} trailing={flipButton} scale={scale} />
  ) : (
    <PlayerRow name={blackName} time={blackTime} isActive={activeColor === "black"} trailing={flipButton} scale={scale} />
  );

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: Math.round(8 * scale), width: "fit-content" }}
    >
      {topRow}
      {children}
      {bottomRow}
    </div>
  );
}
