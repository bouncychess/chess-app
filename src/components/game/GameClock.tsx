import { type ReactNode, useState, useEffect } from "react";
import { Clock } from "./Clock";
import { ResizableCard } from "../ResizableCard";
import type { PlayerColor } from "../../types/chess";

function useResponsiveWidth(minWidth: number, maxWidth: number): number {
  const [width, setWidth] = useState(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 800;
    return Math.min(maxWidth, Math.max(minWidth, vw * 0.6));
  });

  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth;
      setWidth(Math.min(maxWidth, Math.max(minWidth, vw * 0.6)));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [minWidth, maxWidth]);

  return width;
}

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
  const responsiveWidth = useResponsiveWidth(300, 600);

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
      initialWidth={responsiveWidth}
      minWidth={300}
      maxWidth={"100%"}
      resizable
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {topRow}
      {children}
      {bottomRow}
    </ResizableCard>
  );
}
