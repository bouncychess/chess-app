import { useState, type ReactNode, type CSSProperties } from "react";
import { useTheme } from "../context/ThemeContext";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  collapsible?: boolean;
  collapsedLabel?: string;
  defaultCollapsed?: boolean;
}

export function ResizableCard({ children, style, collapsible = false, collapsedLabel, defaultCollapsed = true }: CardProps) {
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (collapsible) {
    return (
      <div style={{
        ...theme.card,
        overflow: 'hidden',
        padding: 8,
        ...style,
        borderRadius: theme.card.borderRadius,
      }}>
        <div
          onClick={() => setCollapsed(c => !c)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        >
          <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{collapsedLabel}</span>
          <span style={{ fontSize: "0.75rem" }}>{collapsed ? "▼" : "▲"}</span>
        </div>
        {!collapsed && (
          <div style={{ marginTop: 8 }}>
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      ...theme.card,
      overflow: 'hidden',
      ...style,
      borderRadius: theme.card.borderRadius,
    }}>
      {children}
    </div>
  );
}
