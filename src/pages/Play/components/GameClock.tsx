import type { ReactNode } from "react";
import { Clock } from "./Clock";
import type { PlayerColor } from "../../../types/chess";

interface GameClockProps {
  whiteTime: number;
  blackTime: number;
  activeColor: PlayerColor | null;
  playerColor: PlayerColor;
  children?: ReactNode;
}

export function GameClock({ whiteTime, blackTime, activeColor, playerColor, children }: GameClockProps) {
  const isPlayerWhite = playerColor === "white";

  const topClock = isPlayerWhite ? (
    <Clock
      time={blackTime}
      isActive={activeColor === "black"}
      playerColor="black"
    />
  ) : (
    <Clock
      time={whiteTime}
      isActive={activeColor === "white"}
      playerColor="white"
    />
  );

  const bottomClock = isPlayerWhite ? (
    <Clock
      time={whiteTime}
      isActive={activeColor === "white"}
      playerColor="white"
    />
  ) : (
    <Clock
      time={blackTime}
      isActive={activeColor === "black"}
      playerColor="black"
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {topClock}
      {children}
      {bottomClock}
    </div>
  );
}
