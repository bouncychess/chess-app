import type { TimeControl } from "../../../types/chess";
import { TIME_CONTROLS } from "../../../constants/timeControls";
import { theme } from "../../../config/theme";

interface TimeControlSelectorProps {
  selected: TimeControl | null;
  onSelect: (timeControl: TimeControl) => void;
}

export function TimeControlSelector({ selected, onSelect }: TimeControlSelectorProps) {
  return (
    <div style={{
      ...theme.card,
      boxSizing: "border-box",
    }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: theme.colors.text }}>Time Control</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
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
                border: isSelected ? "2px solid #22c55e" : `1px solid ${theme.colors.border}`,
                borderRadius: 8,
                backgroundColor: isSelected ? "#dcfce7" : theme.colors.cardBackground,
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
    </div>
  );
}
