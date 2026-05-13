import { useMemo } from "react";
import { Chess } from "chess.js";
import { useTheme } from "../../context/ThemeContext";
import { useStockfishAnalysis } from "../../hooks/useStockfishAnalysis";
import type { EngineInfo, Score } from "../../services/StockfishEngine";
import { ResizableCard } from "../ResizableCard";

interface EngineAnalysisProps {
  fen: string;
  enabled: boolean;
  multipv?: number;
  width?: number | string;
}

const MAX_SAN_PLIES = 12;

export function EngineAnalysis({ fen, enabled, multipv = 3, width }: EngineAnalysisProps) {
  const { theme } = useTheme();
  const { lines } = useStockfishAnalysis(fen, enabled, multipv);
  const sideToMove: "w" | "b" = (fen.split(" ")[1] as "w" | "b") || "w";

  // Best line drives the headline eval and bar.
  const best = lines[0];
  const whiteScore = best ? toWhiteScore(best.score, sideToMove) : null;
  const evalText = whiteScore ? formatScore(whiteScore) : "…";
  const barFill = whiteScore ? scoreToWhitePercent(whiteScore) : 50;

  if (!enabled) return null;

  return (
    <ResizableCard style={{ width, padding: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", minWidth: 56 }}>{evalText}</div>
          <div style={{
            flex: 1,
            height: 14,
            backgroundColor: "#1a1a1a",
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${barFill}%`,
              backgroundColor: "#f5f5f5",
              transition: "width 0.15s linear",
            }} />
          </div>
          {best && (
            <div style={{ fontSize: "0.75rem", color: theme.colors.placeholder, minWidth: 44, textAlign: "right" }}>
              d{best.depth}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            overflowX: "auto",
            scrollbarWidth: "thin",
          }}
        >
          {Array.from({ length: multipv }).map((_, i) => (
            <LineRow key={i} info={lines[i]} fen={fen} sideToMove={sideToMove} />
          ))}
        </div>
      </div>
    </ResizableCard>
  );
}

function LineRow({ info, fen, sideToMove }: { info: EngineInfo | undefined; fen: string; sideToMove: "w" | "b" }) {
  const { theme } = useTheme();
  const san = useMemo(() => (info ? uciPvToSan(fen, info.pv, MAX_SAN_PLIES) : ""), [info, fen]);

  if (!info) {
    return (
      <div style={{ fontSize: "0.85rem", color: theme.colors.placeholder, fontFamily: "monospace" }}>
        …
      </div>
    );
  }

  const whiteScore = toWhiteScore(info.score, sideToMove);
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        fontSize: "0.85rem",
        fontFamily: "monospace",
        whiteSpace: "nowrap",
        // Width: max-content so the row grows to fit its full PV; the parent
        // container's overflow-x produces a single scrollbar across all rows.
        width: "max-content",
      }}
    >
      <span style={{ minWidth: 48, fontWeight: 600, flexShrink: 0 }}>{formatScore(whiteScore)}</span>
      <span>{san}</span>
    </div>
  );
}

function toWhiteScore(score: Score, sideToMove: "w" | "b"): Score {
  if (sideToMove === "w") return score;
  return { type: score.type, value: -score.value };
}

function formatScore(score: Score): string {
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
function scoreToWhitePercent(score: Score): number {
  if (score.type === "mate") return score.value > 0 ? 100 : 0;
  const pawns = Math.max(-10, Math.min(10, score.value / 100));
  return 50 + (pawns / 10) * 50;
}

function uciPvToSan(fen: string, uciMoves: string[], maxPlies: number): string {
  const chess = new Chess();
  try {
    chess.load(fen);
  } catch {
    return uciMoves.slice(0, maxPlies).join(" ");
  }
  // Use the FEN's full-move counter so PV display is correct mid-game, not
  // just from the standard starting position.
  const fenFields = fen.split(" ");
  let fullMove = parseInt(fenFields[5] ?? "1", 10) || 1;
  const sanParts: string[] = [];
  const limit = Math.min(uciMoves.length, maxPlies);
  for (let i = 0; i < limit; i++) {
    const uci = uciMoves[i];
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    let result;
    try {
      result = chess.move({ from, to, promotion });
    } catch {
      break;
    }
    if (!result) break;
    if (result.color === "w") {
      sanParts.push(`${fullMove}.${result.san}`);
    } else {
      // Black move: include the "N..." prefix only when the PV starts on black's
      // turn so subsequent black moves don't all get tagged.
      sanParts.push(i === 0 ? `${fullMove}...${result.san}` : result.san);
      fullMove++;
    }
  }
  return sanParts.join(" ");
}
