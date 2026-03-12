import { useState, useEffect, useCallback, useRef } from "react";
import { theme } from "../config/theme";
import { STREAMERS } from "../config/streamers";

const OVERLAY_WIDTH = 400;
const OVERLAY_HEIGHT = 300;
const TITLE_BAR_HEIGHT = 32;

export default function TwitchOverlay() {
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [position, setPosition] = useState({
    x: window.innerWidth - OVERLAY_WIDTH - 20,
    y: window.innerHeight - OVERLAY_HEIGHT - TITLE_BAR_HEIGHT - 20,
  });
  const [selectedChannel] = useState(STREAMERS[0]);

  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const newX = Math.max(0, Math.min(window.innerWidth - OVERLAY_WIDTH, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - OVERLAY_HEIGHT - TITLE_BAR_HEIGHT, e.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      dragging.current = false;
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (dismissed || STREAMERS.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          ...theme.card,
          padding: "8px 16px",
          cursor: "pointer",
          border: "none",
          color: theme.colors.text,
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: "1rem" }}>📺</span>
        Live
      </button>
    );
  }

  const iframeSrc = `https://player.twitch.tv/?channel=${selectedChannel.channel}&parent=${window.location.hostname}&muted=true`;

  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 1000,
        width: OVERLAY_WIDTH,
        ...theme.card,
        padding: 0,
        overflow: "hidden",
        userSelect: dragging.current ? "none" : "auto",
      }}
    >
      {/* Title bar */}
      <div
        onMouseDown={onMouseDown}
        style={{
          height: TITLE_BAR_HEIGHT,
          backgroundColor: theme.colors.sidebarBackground,
          color: theme.colors.sidebarText,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          cursor: "grab",
          fontSize: "0.875rem",
        }}
      >
        <span>Chesstard{"\u2122"} TV — {selectedChannel.label}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: theme.colors.sidebarText,
              cursor: "pointer",
              fontSize: "1rem",
              padding: 0,
              lineHeight: 1,
            }}
            title="Minimize"
          >
            —
          </button>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: "none",
              border: "none",
              color: theme.colors.sidebarText,
              cursor: "pointer",
              fontSize: "1rem",
              padding: 0,
              lineHeight: 1,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Twitch iframe */}
      <iframe
        src={iframeSrc}
        height={OVERLAY_HEIGHT}
        width={OVERLAY_WIDTH}
        allow="autoplay; encrypted-media"
        style={{ display: "block", border: "none" }}
      />
    </div>
  );
}
