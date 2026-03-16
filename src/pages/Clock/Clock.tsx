import { useState, useEffect } from "react";
import { ResizableCard } from "../../components/ResizableCard";
import { Button } from "../../components/buttons/Button";
import { theme } from "../../config/theme";

const STORAGE_KEY = "clock-start-time";

function loadStartTime(): number | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const ts = Number(stored);
    if (!isNaN(ts)) return ts;
  }
  return null;
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

function toLocalDatetimeString(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Clock() {
  const [startTime, setStartTime] = useState<number | null>(loadStartTime);
  const [elapsed, setElapsed] = useState("");
  const [inputValue, setInputValue] = useState(() => {
    const saved = loadStartTime();
    return saved !== null ? toLocalDatetimeString(saved) : "";
  });

  useEffect(() => {
    if (startTime === null) return;
    const update = () => {
      setElapsed(formatElapsed(Date.now() - startTime));
    };
    update();
    const id = setInterval(update, 10);
    return () => clearInterval(id);
  }, [startTime]);

  const handleSet = () => {
    const ts = new Date(inputValue).getTime();
    if (isNaN(ts)) return;
    localStorage.setItem(STORAGE_KEY, String(ts));
    setStartTime(ts);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStartTime(null);
    setElapsed("");
    setInputValue("");
  };

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
          gap: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>Stopwatch</h2>
        {startTime !== null ? (
          <>
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
            <Button onClick={handleClear} size="sm" variant="secondary">
              Clear
            </Button>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: "0.875rem" }}>Start time</label>
              <input
                type="datetime-local"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={theme.input}
              />
            </div>
            <Button onClick={handleSet} size="sm">
              Set
            </Button>
          </div>
        )}
      </ResizableCard>
    </div>
  );
}
