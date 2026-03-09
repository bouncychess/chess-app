import type { ReactNode, CSSProperties } from "react";
import { useTheme } from "../context/ThemeContext";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function ResizableCard({ children, style }: CardProps) {
  const { theme } = useTheme();
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
