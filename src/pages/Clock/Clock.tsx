import { useState, useEffect } from "react";
import { ResizableCard } from "../../components/ResizableCard";

function getMidnightPST(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const second = Number(get("second"));
  const elapsedSinceMidnight = (hour * 3600 + minute * 60 + second) * 1000;

  return now.getTime() - elapsedSinceMidnight;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

export default function Clock() {
  const [elapsed, setElapsed] = useState("");
  const [midnightPST] = useState(getMidnightPST);

  useEffect(() => {
    const update = () => {
      setElapsed(formatElapsed(Date.now() - midnightPST));
    };
    update();
    const id = setInterval(update, 10);
    return () => clearInterval(id);
  }, [midnightPST]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <ResizableCard
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Time Since Midnight PST</h2>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "3rem",
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          {elapsed}
        </div>
      </ResizableCard>
    </div>
  );
}
