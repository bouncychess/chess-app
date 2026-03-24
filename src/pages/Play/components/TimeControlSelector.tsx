import type { TimeControl } from "../../../types/chess";
import { TIME_CONTROLS } from "../../../constants/timeControls";
import { theme } from "../../../config/theme";
import { useTheme } from "../../../context/ThemeContext";
import { transformColor } from "../../../utils/colorTransform";
import { ResizableCard } from "../../../components/ResizableCard";

interface TimeControlSelectorProps {
  selected: TimeControl | null;
  onSelect: (timeControl: TimeControl) => void;
}

export function TimeControlSelector({ selected, onSelect }: TimeControlSelectorProps) {
  const { isDark } = useTheme();
  const darkAmount = isDark ? 1 : 0;
  const selectedBorder = transformColor("#22c55e", darkAmount, 'accent');
  const selectedBg = transformColor("#dcfce7", darkAmount, 'background');

  return (
    <ResizableCard style={{width: 250}}>
      <h3 style={theme.cardHeader}>Time Control</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8
        }}
      >
        {TIME_CONTROLS.map((tc) => {
          const isSelected = selected?.label === tc.label;
          return (
            <button
              key={tc.label}
              onClick={() => onSelect(tc)}
              style={{
                padding: "12px 8px",
                border: `2px solid ${isSelected ? selectedBorder : theme.colors.border}`,
                borderRadius: 8,
                backgroundColor: isSelected ? selectedBg : theme.colors.cardBackground,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: theme.colors.text,
                transition: "all 0.15s ease",
              }}
            >
              {tc.label}
            </button>
          );
        })}
      </div>
    </ResizableCard>
  );
}
