interface ClockProps {
  time: number;
  isActive: boolean;
  scale?: number;
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

  if (totalSeconds < 180) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${deciseconds}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function Clock({ time, isActive, scale = 1 }: ClockProps) {
  const isLowTime = time < 30000 && time > 0;
  const isFlagged = time <= 0;

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
        padding: `${Math.round(4 * scale)}px ${Math.round(12 * scale)}px`,
        borderRadius: Math.round(6 * scale),
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        transition: "background-color 0.2s ease",
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: `${1.1 * scale}rem`,
          fontWeight: 600,
        }}
      >
        {formatTime(time)}
      </span>
    </div>
  );
}
