import type { ReactNode } from "react";
import { Clock } from "./Clock";
import { ResizableCard } from "../ResizableCard";
import type { PlayerColor } from "../../types/chess";

interface GameClockProps {
  whiteTime: number;
  blackTime: number;
  activeColor: PlayerColor | null;
  playerColor: PlayerColor;
  whiteName: string | null;
  blackName: string | null;
  children?: ReactNode;
}

function PlayerRow({ name, time, isActive }: { name: string | null; time: number; isActive: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{name || ""}</span>
      <Clock time={time} isActive={isActive} />
    </div>
  );
}

export function GameClock({ whiteTime, blackTime, activeColor, playerColor, whiteName, blackName, children }: GameClockProps) {
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

  const bottomRow = isPlayerWhite ? (
    <PlayerRow
      name={whiteName}
      time={whiteTime}
      isActive={activeColor === "white"}
    />
  ) : (
    <PlayerRow
      name={blackName}
      time={blackTime}
      isActive={activeColor === "black"}
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
