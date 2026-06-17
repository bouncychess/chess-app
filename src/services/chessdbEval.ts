// chessdb.cn cloud evaluation database. Huge store of precomputed, accurate
// evaluations. Public, HTTPS, CORS-enabled, no auth required.
// Docs: https://chessdb.cn/cloudbookc_api_en.html
import { Chess } from "chess.js";

const CHESSDB_URL = "https://www.chessdb.cn/cdb.php";
const REQUEST_TIMEOUT_MS = 4000;
const MAX_ATTEMPTS = 2; // one retry
const RETRY_BACKOFF_MS = 600;

export interface ChessdbMove {
    uci: string; // raw chessdb UCI (castling may be king-to-rook)
    score: number; // centipawns, side-to-move perspective
    rank: number; // 2 = best, 1 = ok, 0 = weak
    winrate: number | null;
}

export type ChessdbResult =
    | { status: "ok"; moves: ChessdbMove[] } // non-empty, sorted best-first
    | { status: "unknown" } // position not in the database
    | { status: "nobestmove" }
    | { status: "checkmate" }
    | { status: "stalemate" }
    | { status: "invalid" }
    | { status: "error"; message: string };

export interface ChessdbQuery {
    fen: string;
    signal?: AbortSignal;
}

export class ChessdbError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ChessdbError";
    }
}

// ---- Score classification ----------------------------------------------

export type MoveGrade = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

export const MATE_THRESHOLD = 25000; // |score| at/above this is mate-ish
const WINNING_FLOOR = 300; // dropping a forced win below this = blunder
const SCORE_CLAMP = 2000; // clamp before computing centipawn loss

export function classifyLoss(loss: number): MoveGrade {
    if (loss <= 20) return "best";
    if (loss <= 50) return "good";
    if (loss <= 100) return "inaccuracy";
    if (loss <= 250) return "mistake";
    return "blunder";
}

export interface GradedMove {
    grade: MoveGrade;
    userScore: number; // cp, side-to-move perspective
    bestScore: number;
    loss: number; // max(0, bestScore - userScore)
    bestUci: string;
    bestSan: string;
    userRank: number; // 2/1/0, or -1 if not found
    matched: boolean;
}

// ---- Parsing ------------------------------------------------------------

const EDGE_STATUSES: Record<string, ChessdbResult> = {
    unknown: { status: "unknown" },
    nobestmove: { status: "nobestmove" },
    checkmate: { status: "checkmate" },
    stalemate: { status: "stalemate" },
    "invalid board": { status: "invalid" },
};

export function parseQueryAll(text: string): ChessdbResult {
    const trimmed = text.trim();
    const edge = EDGE_STATUSES[trimmed.toLowerCase()];
    if (edge) return edge;
    if (!trimmed.startsWith("move:")) {
        return { status: "error", message: trimmed || "empty response" };
    }

    const moves: ChessdbMove[] = [];
    for (const segment of trimmed.split("|")) {
        const fields: Record<string, string> = {};
        for (const part of segment.split(",")) {
            const sep = part.indexOf(":");
            if (sep === -1) continue;
            fields[part.slice(0, sep).trim()] = part.slice(sep + 1).trim();
        }
        if (!fields.move) continue;
        const score = Number(fields.score);
        const rank = Number(fields.rank);
        const winrate = fields.winrate !== undefined ? parseFloat(fields.winrate) : NaN;
        moves.push({
            uci: fields.move,
            score: Number.isFinite(score) ? score : 0,
            rank: Number.isFinite(rank) ? rank : 0,
            winrate: Number.isFinite(winrate) ? winrate : null,
        });
    }
    if (moves.length === 0) return { status: "unknown" };
    // chessdb returns best-first, but sort defensively so moves[0] is the best.
    moves.sort((a, b) => b.score - a.score);
    return { status: "ok", moves };
}

// ---- Fetching -----------------------------------------------------------

function combineSignals(a: AbortSignal | undefined, b: AbortSignal): AbortSignal {
    if (!a) return b;
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (a.aborted || b.aborted) controller.abort();
    a.addEventListener("abort", onAbort);
    b.addEventListener("abort", onAbort);
    return controller.signal;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Query chessdb for all known moves at a position. Returns a discriminated
 * result; only rejects with an AbortError when the caller's signal aborts (so
 * callers can treat that as cancellation). Other failures resolve to
 * { status: "error" }. An internal timeout guards against slow responses.
 */
export async function fetchChessdbEval({ fen, signal }: ChessdbQuery): Promise<ChessdbResult> {
    const url = `${CHESSDB_URL}?action=queryall&board=${encodeURIComponent(fen)}`;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const timeout = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            timeout.abort();
        }, REQUEST_TIMEOUT_MS);
        try {
            const response = await fetch(url, { signal: combineSignals(signal, timeout.signal) });
            clearTimeout(timer);
            if (!response.ok) {
                if (attempt < MAX_ATTEMPTS - 1) {
                    await sleep(RETRY_BACKOFF_MS);
                    continue;
                }
                return { status: "error", message: `chessdb request failed (${response.status})` };
            }
            return parseQueryAll(await response.text());
        } catch (err) {
            clearTimeout(timer);
            // The caller cancelled (not our timeout): propagate as cancellation.
            if (signal?.aborted && !timedOut) throw err;
            if (attempt < MAX_ATTEMPTS - 1) {
                await sleep(RETRY_BACKOFF_MS);
                continue;
            }
            return { status: "error", message: err instanceof Error ? err.message : "chessdb fetch failed" };
        }
    }
    return { status: "error", message: "chessdb fetch failed" };
}

/** Ask chessdb to analyze a position it doesn't know yet. Fire-and-forget. */
export function requestChessdbAnalysis(fen: string): void {
    void fetch(`${CHESSDB_URL}?action=queue&board=${encodeURIComponent(fen)}`).catch(() => {});
}

// ---- Move matching & grading -------------------------------------------

// Convert a (possibly castling) UCI to SAN at a position. chessdb encodes
// castling as king-to-rook in some cases; chess.js wants king-to-square — try
// the raw move, then normalize a king move onto its rook.
export function uciToSan(fen: string, uci: string): string | null {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    let to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    try {
        const result = chess.move({ from, to, promotion });
        if (result) return result.san;
    } catch {
        /* fall through to castling normalization */
    }
    const piece = chess.get(from as Parameters<Chess["get"]>[0]);
    if (piece?.type === "k") {
        const rank = from[1];
        if (to === `h${rank}`) to = `g${rank}`;
        else if (to === `a${rank}`) to = `c${rank}`;
        try {
            const result = new Chess(fen).move({ from, to, promotion });
            if (result) return result.san;
        } catch {
            /* unknown */
        }
    }
    return null;
}

/** Map each chessdb move to its SAN at the given position. */
export function chessdbSanMap(fen: string, moves: ChessdbMove[]): Map<string, ChessdbMove> {
    const map = new Map<string, ChessdbMove>();
    for (const m of moves) {
        const san = uciToSan(fen, m.uci);
        if (san && !map.has(san)) map.set(san, m);
    }
    return map;
}

const clamp = (n: number) => Math.max(-SCORE_CLAMP, Math.min(SCORE_CLAMP, n));

/**
 * Grade the user's move against chessdb's evaluation of the parent position.
 * Matches the move by the SAN chess.js derives from its UCI (consistent on both
 * sides, robust to castling). Returns null if the move list is empty.
 */
export function gradeUserMove(
    parentFen: string,
    moves: ChessdbMove[],
    userSan: string,
    userUci: string,
): GradedMove | null {
    if (moves.length === 0) return null;

    const best = moves[0];
    const bestSan = uciToSan(parentFen, best.uci) ?? best.uci;

    const sanMap = chessdbSanMap(parentFen, moves);
    const normalizedSan = uciToSan(parentFen, userUci);
    const matchedMove =
        (normalizedSan ? sanMap.get(normalizedSan) : undefined) ?? sanMap.get(userSan);

    if (!matchedMove) {
        return {
            grade: "blunder",
            userScore: 0,
            bestScore: best.score,
            loss: 0,
            bestUci: best.uci,
            bestSan,
            userRank: -1,
            matched: false,
        };
    }

    const bestScore = best.score;
    const userScore = matchedMove.score;

    let grade: MoveGrade;
    if (Math.abs(bestScore) >= MATE_THRESHOLD && userScore < WINNING_FLOOR) {
        // Threw away a forced win.
        grade = "blunder";
    } else {
        const loss = Math.max(0, clamp(bestScore) - clamp(userScore));
        grade = matchedMove.rank === 2 ? "best" : classifyLoss(loss);
    }

    return {
        grade,
        userScore,
        bestScore,
        loss: Math.max(0, bestScore - userScore),
        bestUci: best.uci,
        bestSan,
        userRank: matchedMove.rank,
        matched: true,
    };
}
