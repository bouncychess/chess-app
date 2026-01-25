import type { TimeControl } from "../../../types/chess";
import { TIME_CONTROLS } from "../../../constants/timeControls";

interface TimeControlSelectorProps {
  selected: TimeControl | null;
  onSelect: (timeControl: TimeControl) => void;
}

export function TimeControlSelector({ selected, onSelect }: TimeControlSelectorProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ margin: "0 0 8px 0", color: "#666" }}>Select Time Control</h4>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          maxWidth: 320,
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
                border: isSelected ? "2px solid #22c55e" : "2px solid #e5e7eb",
                borderRadius: 8,
                backgroundColor: isSelected ? "#dcfce7" : "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
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
