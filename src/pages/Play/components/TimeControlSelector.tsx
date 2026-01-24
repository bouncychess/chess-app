import type { TimeControl } from "../../../types/chess";

const TIME_CONTROLS: TimeControl[] = [
  { initialTime: 60000, increment: 0, label: "1+0" },
  { initialTime: 120000, increment: 1000, label: "2+1" },
  { initialTime: 180000, increment: 0, label: "3+0" },
  { initialTime: 180000, increment: 2000, label: "3+2" },
  { initialTime: 300000, increment: 0, label: "5+0" },
  { initialTime: 300000, increment: 3000, label: "5+3" },
  { initialTime: 600000, increment: 0, label: "10+0" },
  { initialTime: 900000, increment: 10000, label: "15+10" },
];

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
