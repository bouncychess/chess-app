import { useEffect, useState } from "react";
import type { PlayerColor } from "../../../types/chess";

interface ClockProps {
  time: number;
  isActive: boolean;
  playerColor: PlayerColor;
  playerName?: string;
}

function formatTime(ms: number): string {
  if (ms <= 0) return "0:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const deciseconds = Math.floor((ms % 1000) / 100);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  if (totalSeconds < 10) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${deciseconds}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function Clock({ time, isActive, playerColor, playerName }: ClockProps) {
  const [displayTime, setDisplayTime] = useState(time);

  useEffect(() => {
    setDisplayTime(time);
  }, [time]);

  useEffect(() => {
    if (!isActive || displayTime <= 0) return;

    const interval = setInterval(() => {
      setDisplayTime((prev) => Math.max(0, prev - 100));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, displayTime <= 0]);

  const isLowTime = displayTime < 30000 && displayTime > 0;
  const isFlagged = displayTime <= 0;

  const getBackgroundColor = () => {
    if (isFlagged) return "#991b1b";
    if (isLowTime && isActive) return "#ef4444";
    if (isActive) return "#22c55e";
    return "#e5e7eb";
  };

  const getTextColor = () => {
    if (isFlagged || (isLowTime && isActive) || isActive) return "#fff";
    return "#1a1a1a";
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        borderRadius: 8,
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        transition: "background-color 0.2s ease",
      }}
    >
      <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
        {playerName || playerColor.charAt(0).toUpperCase() + playerColor.slice(1)}
      </span>
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "1.5rem",
          fontWeight: 600,
          minWidth: 80,
          textAlign: "right",
        }}
      >
        {formatTime(displayTime)}
      </span>
    </div>
  );
}
