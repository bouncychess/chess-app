import { useState, useEffect, type ReactNode } from "react";
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
  whiteRating?: number | null;
  blackRating?: number | null;
  children?: ReactNode;
  onFlip?: () => void;
  flipped?: boolean;
}

function PlayerRow({ name, rating, time, isActive, trailing }: { name: string | null; rating?: number | null; time: number; isActive: boolean; trailing?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
        {name || ""}
        {typeof rating === "number" && (
          <span style={{ marginLeft: 6, color: theme.colors.placeholder, fontWeight: 400 }}>
            ({rating})
          </span>
        )}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {trailing}
        <Clock time={time} isActive={isActive} />
      </div>
    </div>
  );
}

const MOBILE_BREAKPOINT = 768;

export function GameClock({ whiteTime, blackTime, activeColor, playerColor, whiteName, blackName, whiteRating, blackRating, children, onFlip, flipped = false }: GameClockProps) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When flipped, swap which color appears on top/bottom
  const isPlayerWhite = flipped ? playerColor !== "white" : playerColor === "white";

  const topRow = isPlayerWhite ? (
    <PlayerRow name={blackName} rating={blackRating} time={blackTime} isActive={activeColor === "black"} />
  ) : (
    <PlayerRow name={whiteName} rating={whiteRating} time={whiteTime} isActive={activeColor === "white"} />
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
    <PlayerRow name={whiteName} rating={whiteRating} time={whiteTime} isActive={activeColor === "white"} trailing={flipButton} />
  ) : (
    <PlayerRow name={blackName} rating={blackRating} time={blackTime} isActive={activeColor === "black"} trailing={flipButton} />
  );

  const content = (
    <>
      {topRow}
      {children}
      {bottomRow}
    </>
  );

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "fit-content" }}>
        {content}
      </div>
    );
  }

  return (
    <ResizableCard
      style={{ display: "flex", flexDirection: "column", gap: 8, width: "fit-content" }}
    >
      {content}
    </ResizableCard>
  );
}
