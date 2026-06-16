interface WdlBarProps {
    white: number;
    draws: number;
    black: number;
    height?: number;
    showLabels?: boolean;
}

// Fixed colors so the win/draw/loss bar reads the same in every theme.
const WHITE_COLOR = "#f7f7f7";
const DRAW_COLOR = "#9b9b9b";
const BLACK_COLOR = "#3d3a37";

function pct(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
}

/** A horizontal stacked white / draw / black outcome bar. */
function WdlBar({ white, draws, black, height = 22, showLabels = true }: WdlBarProps) {
    const total = white + draws + black;
    const segments = [
        { value: white, color: WHITE_COLOR, text: "#1a1a1a" },
        { value: draws, color: DRAW_COLOR, text: "#ffffff" },
        { value: black, color: BLACK_COLOR, text: "#ffffff" },
    ];

    return (
        <div
            style={{
                display: "flex",
                width: "100%",
                height,
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.15)",
                fontSize: "0.72rem",
                fontWeight: 600,
            }}
        >
            {segments.map((seg, i) => {
                const p = pct(seg.value, total);
                if (p === 0) return null;
                return (
                    <div
                        key={i}
                        style={{
                            width: `${p}%`,
                            background: seg.color,
                            color: seg.text,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                        }}
                        title={`${Math.round(p)}%`}
                    >
                        {showLabels && p >= 12 ? `${Math.round(p)}%` : ""}
                    </div>
                );
            })}
        </div>
    );
}

export default WdlBar;
