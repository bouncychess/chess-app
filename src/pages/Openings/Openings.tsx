import { useCallback, useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { useTheme } from "../../context/ThemeContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { Button } from "../../components/buttons/Button";
import { useLichessAuth } from "../../hooks/useLichessAuth";
import OpeningsBoard, { type OpeningsBoardMove } from "./components/OpeningsBoard";
import ExplorerPanel from "./components/ExplorerPanel";
import LichessConnect from "./components/LichessConnect";
import {
    fetchOpeningExplorer,
    bucketsAtLeast,
    DEFAULT_SPEEDS,
    DEFAULT_MIN_RATING,
    RATING_BUCKETS,
    type RatingBucket,
    type ExplorerResponse,
    type ExplorerMove,
} from "../../services/openingExplorer";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface HistoryMove {
    uci: string;
    san: string;
    fen: string;
}

const RATING_OPTIONS: { value: RatingBucket; label: string }[] = [
    { value: 0, label: "All ratings" },
    { value: 1600, label: "1600+" },
    { value: 1800, label: "1800+" },
    { value: 2000, label: "2000+" },
    { value: 2200, label: "2200+" },
    { value: 2500, label: "2500+" },
];

function Openings() {
    const { theme } = useTheme();
    const auth = useLichessAuth();

    const [history, setHistory] = useState<HistoryMove[]>([]);
    // cursor === -1 means the starting position; otherwise an index into history.
    const [cursor, setCursor] = useState(-1);
    const [orientation, setOrientation] = useState<"white" | "black">("white");
    const [boardSize, setBoardSize] = useState(() =>
        Math.max(320, Math.min(560, window.innerWidth - 440)),
    );
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

    const [minRating, setMinRating] = useLocalStorage<RatingBucket>({
        key: "openings-min-rating",
        defaultValue: DEFAULT_MIN_RATING,
        serialize: (v) => String(v),
        deserialize: (s) => {
            const n = Number(s) as RatingBucket;
            return RATING_BUCKETS.includes(n) ? n : undefined;
        },
    });

    const [data, setData] = useState<ExplorerResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentFen = cursor < 0 ? START_FEN : history[cursor].fen;
    const lastMove = useMemo<[string, string] | null>(() => {
        if (cursor < 0) return null;
        const uci = history[cursor].uci;
        return [uci.slice(0, 2), uci.slice(2, 4)];
    }, [cursor, history]);

    useEffect(() => {
        const onResize = () => {
            setIsMobile(window.innerWidth < 900);
            setBoardSize(Math.max(320, Math.min(560, window.innerWidth - 440)));
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Append a move from the current position, truncating any "forward" line.
    const pushMove = useCallback(
        (move: HistoryMove) => {
            setHistory((prev) => {
                const base = cursor < 0 ? [] : prev.slice(0, cursor + 1);
                return [...base, move];
            });
            setCursor((c) => c + 1);
        },
        [cursor],
    );

    const handleBoardMove = useCallback(
        (move: OpeningsBoardMove) => pushMove(move),
        [pushMove],
    );

    // Apply a move chosen from the explorer table (UCI) at the current position.
    const handleExplorerMove = useCallback(
        (m: ExplorerMove) => {
            const chess = new Chess(currentFen);
            try {
                const result = chess.move({
                    from: m.uci.slice(0, 2),
                    to: m.uci.slice(2, 4),
                    promotion: m.uci.length > 4 ? m.uci[4] : undefined,
                });
                if (!result) return;
                pushMove({ uci: m.uci, san: result.san, fen: chess.fen() });
            } catch {
                /* ignore illegal move from stale data */
            }
        },
        [currentFen, pushMove],
    );

    const goBack = useCallback(() => setCursor((c) => Math.max(-1, c - 1)), []);
    const goForward = useCallback(
        () => setCursor((c) => Math.min(history.length - 1, c + 1)),
        [history.length],
    );
    const goStart = useCallback(() => setCursor(-1), []);
    const goEnd = useCallback(() => setCursor(history.length - 1), [history.length]);
    const reset = useCallback(() => {
        setHistory([]);
        setCursor(-1);
    }, []);

    // Keyboard navigation through the line.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
            if (e.key === "ArrowLeft") goBack();
            else if (e.key === "ArrowRight") goForward();
            else if (e.key === "f") setOrientation((o) => (o === "white" ? "black" : "white"));
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [goBack, goForward]);

    // Fetch explorer data whenever the position or rating filter changes.
    // A short debounce + AbortController keeps at most one request in flight
    // (the explorer is rate-limited) and lets rapid navigation settle first.
    useEffect(() => {
        // Wait for the auth check; don't fire a doomed request when not authorized.
        if (auth.status === "loading") return;
        if (!auth.isAuthorized) {
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        const ratings = bucketsAtLeast(minRating);
        const timer = setTimeout(() => {
            fetchOpeningExplorer({ fen: currentFen, ratings, speeds: DEFAULT_SPEEDS, signal: controller.signal })
                .then((res) => {
                    setData(res);
                    setLoading(false);
                })
                .catch((err) => {
                    if (err.name === "AbortError") return;
                    setError(err.message || "Failed to load opening data.");
                    setLoading(false);
                });
        }, 120);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [currentFen, minRating, auth.status, auth.isAuthorized, auth.token]);

    // Build a readable move list grouped by full move (1. e4 e5 2. Nf3 ...).
    const moveRows = useMemo(() => {
        const rows: { number: number; white?: HistoryMove & { ply: number }; black?: HistoryMove & { ply: number } }[] = [];
        history.forEach((m, i) => {
            const moveNumber = Math.floor(i / 2) + 1;
            const isWhite = i % 2 === 0;
            const withPly = { ...m, ply: i };
            if (isWhite) rows.push({ number: moveNumber, white: withPly });
            else rows[rows.length - 1].black = withPly;
        });
        return rows;
    }, [history]);

    const navBtn = (label: string, onClick: () => void, disabled: boolean) => (
        <Button size="sm" variant="secondary" onClick={onClick} disabled={disabled}>
            {label}
        </Button>
    );

    return (
        <div style={{ padding: isMobile ? 12 : 20 }}>
            <h1 style={{ margin: "0 0 16px", fontSize: "1.4rem", color: theme.colors.text }}>Openings Explorer</h1>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 20,
                    alignItems: "flex-start",
                    justifyContent: isMobile ? "center" : "flex-start",
                }}
            >
                {/* Board + controls */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <OpeningsBoard
                        fen={currentFen}
                        lastMove={lastMove}
                        orientation={orientation}
                        size={boardSize}
                        onMove={handleBoardMove}
                    />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {navBtn("⏮", goStart, cursor < 0)}
                        {navBtn("◀", goBack, cursor < 0)}
                        {navBtn("▶", goForward, cursor >= history.length - 1)}
                        {navBtn("⏭", goEnd, cursor >= history.length - 1)}
                        <Button size="sm" variant="secondary" onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))}>
                            Flip
                        </Button>
                        <Button size="sm" variant="danger" onClick={reset} disabled={history.length === 0}>
                            Reset
                        </Button>
                    </div>
                </div>

                {/* Right column: filter, explorer, move list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 360, maxWidth: "100%" }}>
                    {/* Lichess account connection (required by the explorer) */}
                    <LichessConnect auth={auth} theme={theme} />

                    {/* Rating filter */}
                    <div
                        style={{
                            ...theme.card,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            padding: "12px 16px",
                        }}
                    >
                        <label htmlFor="min-rating" style={{ fontSize: "0.85rem", fontWeight: 600, color: theme.colors.cardText }}>
                            Min. rating
                        </label>
                        <select
                            id="min-rating"
                            value={minRating}
                            onChange={(e) => setMinRating(Number(e.target.value) as RatingBucket)}
                            style={{
                                ...theme.input,
                                backgroundColor: theme.colors.cardBackground,
                                color: theme.colors.cardText,
                                cursor: "pointer",
                            }}
                        >
                            {RATING_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <ExplorerPanel
                        data={data}
                        loading={loading}
                        error={error}
                        theme={theme}
                        onPlayMove={handleExplorerMove}
                    />

                    {/* Move list */}
                    {history.length > 0 && (
                        <div style={{ ...theme.card, padding: "10px 12px", fontSize: "0.85rem" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 2, lineHeight: 1.9 }}>
                                {moveRows.map((row) => (
                                    <span key={row.number} style={{ display: "inline-flex", gap: 4, marginRight: 6 }}>
                                        <span style={{ color: theme.colors.placeholder }}>{row.number}.</span>
                                        {row.white && (
                                            <button
                                                onClick={() => setCursor(row.white!.ply)}
                                                style={moveChipStyle(cursor === row.white.ply, theme)}
                                            >
                                                {row.white.san}
                                            </button>
                                        )}
                                        {row.black && (
                                            <button
                                                onClick={() => setCursor(row.black!.ply)}
                                                style={moveChipStyle(cursor === row.black.ply, theme)}
                                            >
                                                {row.black.san}
                                            </button>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function moveChipStyle(active: boolean, theme: ReturnType<typeof useTheme>["theme"]): React.CSSProperties {
    return {
        background: active ? theme.colors.squareHighlight : "transparent",
        border: "none",
        borderRadius: 3,
        padding: "1px 4px",
        cursor: "pointer",
        fontWeight: 700,
        fontFamily: "inherit",
        fontSize: "0.85rem",
        color: theme.colors.cardText,
    };
}

export default Openings;
