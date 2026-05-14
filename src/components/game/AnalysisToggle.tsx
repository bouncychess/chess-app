import { useTheme } from "../../context/ThemeContext";
import { Tooltip } from "../Tooltip";

interface AnalysisToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

const TRACK_WIDTH = 32;
const TRACK_HEIGHT = 16;
const KNOB_SIZE = 12;
const KNOB_INSET = 2;

export function AnalysisToggle({ enabled, onToggle }: AnalysisToggleProps) {
  const { theme } = useTheme();
  const offBg = theme.colors.border;
  return (
    <Tooltip content={enabled ? "Hide analysis" : "Show analysis"} position="top">
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: "0.75rem", color: theme.colors.placeholder }}>Analysis</span>
        <button
          type="button"
          onClick={onToggle}
          aria-label={enabled ? "Hide analysis" : "Show analysis"}
          aria-pressed={enabled}
          style={{
            position: "relative",
            width: TRACK_WIDTH,
            height: TRACK_HEIGHT,
            padding: 0,
            border: "none",
            borderRadius: TRACK_HEIGHT / 2,
            background: enabled ? theme.colors.success : offBg,
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: KNOB_INSET,
              left: enabled ? TRACK_WIDTH - KNOB_SIZE - KNOB_INSET : KNOB_INSET,
              width: KNOB_SIZE,
              height: KNOB_SIZE,
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
              transition: "left 0.15s ease",
            }}
          />
        </button>
      </div>
    </Tooltip>
  );
}
