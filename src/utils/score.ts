import type { Score } from "../services/StockfishEngine";

// Engine scores are reported from the side-to-move perspective; flip to white's.
export function toWhiteScore(score: Score, sideToMove: "w" | "b"): Score {
    if (sideToMove === "w") return score;
    return { type: score.type, value: -score.value };
}

export function formatScore(score: Score): string {
    if (score.type === "mate") {
        if (score.value === 0) return "#";
        return `${score.value > 0 ? "" : "-"}M${Math.abs(score.value)}`;
    }
    const pawns = score.value / 100;
    const sign = pawns >= 0 ? "+" : "";
    return `${sign}${pawns.toFixed(2)}`;
}

// Map an eval to a 0-100% bar fill representing how much of the bar should be
// "white". Capped at +/-10 pawns so a mate-in-1 doesn't make smaller advantages
// look identical visually.
export function scoreToWhitePercent(score: Score): number {
    if (score.type === "mate") return score.value > 0 ? 100 : 0;
    const pawns = Math.max(-10, Math.min(10, score.value / 100));
    return 50 + (pawns / 10) * 50;
}

// chessdb evals come as a raw centipawn integer from the side-to-move
// perspective, with mate-ish positions encoded as very large magnitudes.
// Convert to a white-positive display string consistent with the engine bar.
const CHESSDB_MATE_THRESHOLD = 25000;

export function formatChessdbScore(cp: number, sideToMove: "w" | "b"): string {
    const white = sideToMove === "w" ? cp : -cp;
    if (Math.abs(white) >= CHESSDB_MATE_THRESHOLD) {
        return white > 0 ? "+M" : "-M";
    }
    return formatScore({ type: "cp", value: white });
}
