import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { useTheme } from "../../context/ThemeContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { Button } from "../../components/buttons/Button";
import { useLichessAuth } from "../../hooks/useLichessAuth";
import { EngineAnalysis } from "../../components/game/EngineAnalysis";
import { AnalysisToggle } from "../../components/game/AnalysisToggle";
import OpeningsBoard, { type OpeningsBoardMove } from "./components/OpeningsBoard";
import ExplorerPanel from "./components/ExplorerPanel";
import LichessConnect from "./components/LichessConnect";
import WdlBar from "./components/WdlBar";
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

// In play mode the book opponent keeps replying while the current position has
// at least this many games on record; below it, we're "out of book".
const BOOK_THRESHOLD = 100;

interface HistoryMove {
    uci: string;
    san: string;
    fen: string;
}

// One move shown in the feedback list (the move played plus the more popular
// ones above it), with its share of games and result counts.
interface FeedbackRow {
    san: string;
    uci: string;
    sharePct: number;
    white: number;
    draws: number;
    black: number;
    isUser: boolean;
}

// Feedback on the user's last move in play mode: was it a book move, and how
// popular, judged against the explorer stats for the position it came from.
interface MoveFeedback {
    san: string;
    status: "book" | "offbook" | "unknown";
    rank: number; // 1-based popularity rank among listed book moves (0 if N/A)
    totalMoves: number; // number of listed book moves
    avgRating: number | null;
    // The move played plus every more-popular move above it (most popular first),
    // so the user can see the better-known choices. For off-book moves this holds
    // the top moves they could have considered instead.
    rows: FeedbackRow[];
}

function gamesPlayed(m: ExplorerMove): number {
    return m.white + m.draws + m.black;
}

// Pick a reply weighted by how often each move is actually played at this
// position (the move's share of total games).
function sampleBookMove(moves: ExplorerMove[]): ExplorerMove {
    const total = moves.reduce((sum, m) => sum + gamesPlayed(m), 0);
    let r = Math.random() * total;
    for (const m of moves) {
        r -= gamesPlayed(m);
        if (r < 0) return m;
    }
    return moves[moves.length - 1];
}

function turnOf(fen: string): "white" | "black" {
    return fen.split(" ")[1] === "b" ? "black" : "white";
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
    // The position `data` corresponds to, so the book opponent only replies
    // once stats for the actual current position have loaded.
    const [dataFen, setDataFen] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Play mode: hide stats on your turn; the opponent replies from the book.
    const [playMode, setPlayMode] = useState(false);
    const [userColor, setUserColor] = useState<"white" | "black">("white");
    const [outOfBook, setOutOfBook] = useState(false);
    const [analysisEnabled, setAnalysisEnabled] = useState(false);
    const [lastMoveFeedback, setLastMoveFeedback] = useState<MoveFeedback | null>(null);
    // The position the opponent has already responded to (guards double-replies).
    const lastReplyFen = useRef<string | null>(null);

    const currentFen = cursor < 0 ? START_FEN : history[cursor].fen;
    const turnColor = useMemo(() => turnOf(currentFen), [currentFen]);
    const isUserTurn = !playMode || turnColor === userColor;
    const hideStats = playMode && !outOfBook;
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
            setOutOfBook(false);
        },
        [cursor],
    );

    const handleBoardMove = useCallback(
        (move: OpeningsBoardMove) => {
            // A fresh user move leads to a new position the opponent hasn't seen.
            lastReplyFen.current = null;

            // In play mode, grade the move against the book for the position it
            // came from (the explorer returns moves sorted by popularity).
            if (playMode) {
                const moves = data && dataFen === currentFen ? data.moves : null;
                if (!moves) {
                    setLastMoveFeedback({ san: move.san, status: "unknown", rank: 0, totalMoves: 0, avgRating: null, rows: [] });
                } else {
                    const total = data!.white + data!.draws + data!.black;
                    const share = (m: ExplorerMove) => (total > 0 ? (gamesPlayed(m) / total) * 100 : 0);
                    const toRow = (m: ExplorerMove, isUser: boolean): FeedbackRow => ({
                        san: m.san, uci: m.uci, sharePct: share(m), white: m.white, draws: m.draws, black: m.black, isUser,
                    });
                    const idx = moves.findIndex((m) => m.uci === move.uci);
                    if (idx >= 0) {
                        // Show the played move and everything more popular above it.
                        const rows = moves.slice(0, idx + 1).map((m, i) => toRow(m, i === idx));
                        setLastMoveFeedback({
                            san: move.san,
                            status: "book",
                            rank: idx + 1,
                            totalMoves: moves.length,
                            avgRating: moves[idx].averageRating,
                            rows,
                        });
                    } else {
                        // Off book: show the popular moves they could have played.
                        const rows = moves.slice(0, 5).map((m) => toRow(m, false));
                        setLastMoveFeedback({ san: move.san, status: "offbook", rank: 0, totalMoves: moves.length, avgRating: null, rows });
                    }
                }
            }

            pushMove(move);
        },
        [pushMove, playMode, data, dataFen, currentFen],
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
        setOutOfBook(false);
        setLastMoveFeedback(null);
        lastReplyFen.current = null;
    }, []);

    const startPlay = useCallback(
        (color: "white" | "black") => {
            setCursor(history.length - 1); // play from the live tip of the line
            setUserColor(color);
            setOrientation(color); // view from the user's side
            setOutOfBook(false);
            setLastMoveFeedback(null);
            lastReplyFen.current = null;
            setPlayMode(true);
        },
        [history.length],
    );

    const stopPlay = useCallback(() => {
        setPlayMode(false);
        setOutOfBook(false);
        setLastMoveFeedback(null);
        lastReplyFen.current = null;
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
        const fenForFetch = currentFen;
        setLoading(true);
        setError(null);
        const ratings = bucketsAtLeast(minRating);
        const timer = setTimeout(() => {
            fetchOpeningExplorer({ fen: fenForFetch, ratings, speeds: DEFAULT_SPEEDS, signal: controller.signal })
                .then((res) => {
                    setData(res);
                    setDataFen(fenForFetch);
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

    // Play mode: when it's the opponent's turn, sample a reply from the book
    // (weighted by how often each move is played) and play it — as long as the
    // current position still has at least BOOK_THRESHOLD games.
    useEffect(() => {
        if (!playMode) return;
        if (cursor !== history.length - 1) return; // only respond at the live tip
        if (turnColor === userColor) return; // user's move
        if (!data || dataFen !== currentFen) return; // wait for this position's stats
        if (lastReplyFen.current === currentFen) return; // already responded

        const total = data.white + data.draws + data.black;
        if (total < BOOK_THRESHOLD || data.moves.length === 0) {
            lastReplyFen.current = currentFen;
            setOutOfBook(true);
            return;
        }

        const pick = sampleBookMove(data.moves);
        const chess = new Chess(currentFen);
        try {
            const result = chess.move({
                from: pick.uci.slice(0, 2),
                to: pick.uci.slice(2, 4),
                promotion: pick.uci.length > 4 ? pick.uci[4] : undefined,
            });
            if (result) {
                lastReplyFen.current = currentFen;
                pushMove({ uci: pick.uci, san: result.san, fen: chess.fen() });
            }
        } catch {
            /* ignore — stale data */
        }
    }, [playMode, cursor, history.length, turnColor, userColor, data, dataFen, currentFen, pushMove]);

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
                        movableColor={playMode ? userColor : "both"}
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

                    {/* Play mode + analysis controls */}
                    <div style={{ ...theme.card, display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: theme.colors.cardText }}>
                                Play mode
                            </span>
                            <AnalysisToggle enabled={analysisEnabled} onToggle={() => setAnalysisEnabled((v) => !v)} />
                        </div>

                        {playMode ? (
                            <>
                                <div style={{ fontSize: "0.82rem", color: theme.colors.placeholder }}>
                                    You play <strong style={{ color: theme.colors.cardText }}>{userColor}</strong>.{" "}
                                    {outOfBook ? (
                                        <span style={{ color: theme.colors.danger }}>
                                            Out of book — fewer than {BOOK_THRESHOLD.toLocaleString()} games. Moves revealed.
                                        </span>
                                    ) : isUserTurn ? (
                                        "Your move — opponent will reply from the book."
                                    ) : (
                                        "Opponent is choosing a move…"
                                    )}
                                </div>
                                {lastMoveFeedback && (
                                    <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                                        {lastMoveFeedback.status === "book" && (
                                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: theme.colors.success }}>
                                                ✓ {lastMoveFeedback.san} — {lastMoveFeedback.rank === 1 ? "most popular move" : "book move"}
                                                <span style={{ fontWeight: 500, color: theme.colors.placeholder, marginLeft: 6, fontSize: "0.78rem" }}>
                                                    {ordinal(lastMoveFeedback.rank)} of {lastMoveFeedback.totalMoves}
                                                    {lastMoveFeedback.avgRating ? ` · avg ${lastMoveFeedback.avgRating}` : ""}
                                                </span>
                                            </div>
                                        )}
                                        {lastMoveFeedback.status === "offbook" && (
                                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#c2410c" }}>
                                                ⚠ {lastMoveFeedback.san} — not a top book move at this rating
                                            </div>
                                        )}
                                        {lastMoveFeedback.status === "unknown" && (
                                            <div style={{ fontSize: "0.85rem", color: theme.colors.placeholder }}>
                                                {lastMoveFeedback.san} — book data wasn’t loaded yet
                                            </div>
                                        )}

                                        {/* Played move plus the more-popular moves above it */}
                                        {lastMoveFeedback.rows.length > 0 && (
                                            <>
                                                {(lastMoveFeedback.status === "offbook" || lastMoveFeedback.rank > 1) && (
                                                    <div style={{ fontSize: "0.72rem", color: theme.colors.placeholder }}>
                                                        {lastMoveFeedback.status === "offbook"
                                                            ? "Most popular moves here:"
                                                            : "More popular moves — yours highlighted:"}
                                                    </div>
                                                )}
                                                <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 168, overflowY: "auto" }}>
                                                    {lastMoveFeedback.rows.map((r) => (
                                                        <div
                                                            key={r.uci}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 8,
                                                                padding: "3px 6px",
                                                                borderRadius: 4,
                                                                background: r.isUser ? theme.colors.moveHighlight : "transparent",
                                                            }}
                                                        >
                                                            <span style={{ minWidth: 42, fontWeight: 700, fontSize: "0.82rem", color: theme.colors.cardText }}>{r.san}</span>
                                                            <span style={{ minWidth: 34, textAlign: "right", fontSize: "0.72rem", color: theme.colors.placeholder }}>{Math.round(r.sharePct)}%</span>
                                                            <div style={{ flex: 1 }}>
                                                                <WdlBar white={r.white} draws={r.draws} black={r.black} height={16} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {data?.opening && (
                                            <div style={{ fontSize: "0.8rem", color: theme.colors.cardText }}>
                                                <span style={{ color: theme.colors.placeholder, marginRight: 4 }}>{data.opening.eco}</span>
                                                {data.opening.name}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <Button size="sm" variant="danger" onClick={stopPlay}>
                                    Exit play mode
                                </Button>
                            </>
                        ) : (
                            <div style={{ display: "flex", gap: 8 }}>
                                <Button size="sm" variant="primary" onClick={() => startPlay("white")} disabled={!auth.isAuthorized}>
                                    Play as White
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => startPlay("black")} disabled={!auth.isAuthorized}>
                                    Play as Black
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Engine evaluation */}
                    {analysisEnabled && (
                        <EngineAnalysis fen={currentFen} enabled={analysisEnabled} width="100%" />
                    )}

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
                        hidden={hideStats}
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

function ordinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
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
