import type { ReactNode } from "react";
import { Clock } from "./Clock";
import { ResizableCard } from "../ResizableCard";
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
}

function PlayerRow({ name, time, isActive, trailing }: { name: string | null; time: number; isActive: boolean; trailing?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{name || ""}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {trailing}
        <Clock time={time} isActive={isActive} />
      </div>
    </div>
  );
}

export function GameClock({ whiteTime, blackTime, activeColor, playerColor, whiteName, blackName, children, onFlip }: GameClockProps) {
  const isPlayerWhite = playerColor === "white";

  const topRow = isPlayerWhite ? (
    <PlayerRow
      name={blackName}
      time={blackTime}
      isActive={activeColor === "black"}
    />
  ) : (
    <PlayerRow
      name={whiteName}
      time={whiteTime}
      isActive={activeColor === "white"}
    />
  );

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
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 14V2M1 5l3-3 3 3" stroke={theme.colors.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 2v12M9 11l3 3 3-3" stroke={theme.colors.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  ) : undefined;

  const bottomRow = isPlayerWhite ? (
    <PlayerRow
      name={whiteName}
      time={whiteTime}
      isActive={activeColor === "white"}
      trailing={flipButton}
    />
  ) : (
    <PlayerRow
      name={blackName}
      time={blackTime}
      isActive={activeColor === "black"}
      trailing={flipButton}
    />
  );

  return (
    <ResizableCard
      style={{ display: "flex", flexDirection: "column", gap: 8, width: "fit-content" }}
    >
      {topRow}
      {children}
      {bottomRow}
    </ResizableCard>
  );
}
