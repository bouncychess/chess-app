import type { ReactNode, CSSProperties } from "react";
import { theme } from "../config/theme";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function ResizableCard({ children, style }: CardProps) {
  return (
    <div style={{
      ...theme.card,
      ...style,
      borderRadius: theme.card.borderRadius,
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}
