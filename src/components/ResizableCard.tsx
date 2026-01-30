import { useState, useRef, useCallback, useEffect } from "react";
import type { ReactNode, CSSProperties } from "react";
import { theme } from "../config/theme";

interface ResizableCardProps {
  children: ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number | string;
  style?: CSSProperties;
  resizable?: boolean;
}

export function ResizableCard({
  children,
  initialWidth = 300,
  minWidth = 200,
  maxWidth = 800,
  style,
  resizable = false,
}: ResizableCardProps) {
  const [cardWidth, setCardWidth] = useState(initialWidth);
  const isResizing = useRef(false);
  const startPos = useRef({ x: 0, width: 0 });

  // Sync with initialWidth when it changes (e.g., window resize)
  useEffect(() => {
    if (!isResizing.current) {
      setCardWidth(initialWidth);
    }
  }, [initialWidth]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const delta = e.clientX - startPos.current.x;
    const maxNum = typeof maxWidth === "number" ? maxWidth : Infinity;
    const newWidth = Math.max(minWidth, Math.min(maxNum, startPos.current.width + delta));
    setCardWidth(newWidth);
  }, [minWidth, maxWidth]);

  const handleResizeEnd = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startPos.current = { x: e.clientX, width: cardWidth };
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  }, [cardWidth, handleResizeMove, handleResizeEnd]);

  return (
    <div style={{
      ...theme.card,
      width: resizable ? cardWidth : initialWidth,
      maxWidth: !resizable && typeof maxWidth === "string" ? maxWidth : undefined,
      position: "relative",
      ...style,
    }}>
      {children}
      {resizable && (
        <div
          onMouseDown={handleResizeStart}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 16,
            height: 16,
            cursor: "nwse-resize",
            background: `linear-gradient(135deg, transparent 50%, ${theme.colors.border} 50%)`,
            borderRadius: "0 0 8px 0",
          }}
        />
      )}
    </div>
  );
}
