// A player's opening repertoire, normalized from either lichess or chess.com to
// the same shape: for a position + color, the moves that player has played with
// counts. Used in Openings play mode to check whether the user is following a
// chosen player's repertoire.
import { Chess } from "chess.js";
import { uciToSan } from "./chessdbEval";
import { getLichessToken } from "./openingExplorer";

export type RepColor = "white" | "black";

export interface PlayerMove {
    san: string; // SAN at the parent position (castling-normalized)
    count: number; // times the player played this move from here
}

export type PlayerMovesResult =
    | { status: "ok"; moves: PlayerMove[]; total: number } // total = games reaching this position
    | { status: "none" } // player never reached this position
    | { status: "error"; message: string };

// First 4 FEN fields (board, side, castling, en passant) — drops the move
// counters so the same position reached via different move orders shares a key.
export function positionKey(fen: string): string {
    return fen.split(" ").slice(0, 4).join(" ");
}

// ---- shared fetch helpers (mirror chessdbEval) --------------------------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function combineSignals(a: AbortSignal | undefined, b: AbortSignal): AbortSignal {
    if (!a) return b;
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (a.aborted || b.aborted) controller.abort();
    a.addEventListener("abort", onAbort);
    b.addEventListener("abort", onAbort);
    return controller.signal;
}

// ---- Lichess (per-position) ---------------------------------------------

const LICHESS_PLAYER_URL = "https://explorer.lichess.ovh/player";
const LICHESS_TIMEOUT_MS = 6000;

interface LichessPlayerMove {
    uci: string;
    san: string;
    white: number;
    draws: number;
    black: number;
}
interface LichessPlayerResponse {
    white: number;
    draws: number;
    black: number;
    moves: LichessPlayerMove[];
}

export interface LichessPlayerQuery {
    username: string;
    color: RepColor;
    fen: string;
    signal?: AbortSignal;
}

// Normalize lichess moves to {san, count}, collapsing castling-encoding and
// any duplicate SANs, sorted by count desc.
function normalizeLichessMoves(fen: string, moves: LichessPlayerMove[]): PlayerMove[] {
    const counts = new Map<string, number>();
    for (const m of moves) {
        const san = uciToSan(fen, m.uci) ?? m.san;
        const c = m.white + m.draws + m.black;
        counts.set(san, (counts.get(san) ?? 0) + c);
    }
    return [...counts]
        .map(([san, count]) => ({ san, count }))
        .sort((a, b) => b.count - a.count);
}

// The player endpoint is application/x-ndjson and STREAMS progressive snapshots
// while it (re)indexes the player's games, keeping the connection open for tens
// of seconds. Each line is a complete result; the first line already has the
// aggregated data, so we read just that and close the stream.
async function readFirstNdjsonLine(response: Response): Promise<LichessPlayerResponse | null> {
    const body = response.body;
    if (!body) return (await response.json()) as LichessPlayerResponse;
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (value) buffer += decoder.decode(value, { stream: true });
            const nl = buffer.indexOf("\n");
            if (nl >= 0) {
                const line = buffer.slice(0, nl).trim();
                if (line) return JSON.parse(line) as LichessPlayerResponse;
                buffer = buffer.slice(nl + 1);
            }
            if (done) {
                const rest = buffer.trim();
                return rest ? (JSON.parse(rest) as LichessPlayerResponse) : null;
            }
        }
    } finally {
        // Stop indexing/streaming — we have what we need.
        reader.cancel().catch(() => {});
    }
}

/** Fetch the moves a lichess player has played from a position (their color). */
export async function fetchLichessPlayerMoves({
    username,
    color,
    fen,
    signal,
}: LichessPlayerQuery): Promise<PlayerMovesResult> {
    const params = new URLSearchParams({ player: username, color, fen, recentGames: "0" });
    const url = `${LICHESS_PLAYER_URL}?${params.toString()}`;
    const token = getLichessToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    for (let attempt = 0; attempt < 2; attempt++) {
        const timeout = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            timeout.abort();
        }, LICHESS_TIMEOUT_MS);
        try {
            const response = await fetch(url, { signal: combineSignals(signal, timeout.signal), headers });
            if (response.status === 429) {
                clearTimeout(timer);
                if (attempt === 0) {
                    await sleep(1500);
                    continue;
                }
                return { status: "error", message: "lichess player explorer is rate limited" };
            }
            if (!response.ok) {
                clearTimeout(timer);
                return { status: "error", message: `lichess player request failed (${response.status})` };
            }
            const json = await readFirstNdjsonLine(response);
            clearTimeout(timer);
            if (!json) return { status: "none" };
            const total = json.white + json.draws + json.black;
            if (total === 0) return { status: "none" };
            return { status: "ok", moves: normalizeLichessMoves(fen, json.moves), total };
        } catch (err) {
            clearTimeout(timer);
            if (signal?.aborted && !timedOut) throw err; // caller cancelled
            if (attempt === 0) {
                await sleep(800);
                continue;
            }
            return { status: "error", message: err instanceof Error ? err.message : "lichess fetch failed" };
        }
    }
    return { status: "error", message: "lichess fetch failed" };
}

// ---- Chess.com (build from archives) ------------------------------------

const CHESSCOM_BASE = "https://api.chess.com/pub/player";

export type RepBuildStatus = "ok" | "notfound" | "error" | "aborted";

export interface ChesscomBuildQuery {
    username: string;
    maxGames?: number;
    maxMonths?: number;
    onProgress?: (p: { gamesUsed: number; archivesDone: number; archivesTotal: number }) => void;
    signal?: AbortSignal;
}

export interface ChesscomBuildResult {
    // positionKey -> (san -> count), one map per color (built in a single pass).
    white: Map<string, Map<string, number>>;
    black: Map<string, Map<string, number>>;
    gamesUsed: number;
    status: RepBuildStatus;
    message?: string;
}

interface ChesscomGame {
    pgn?: string;
    rules?: string;
    white?: { username?: string };
    black?: { username?: string };
}

// Replay a game's mainline and tally every move the target color played.
function addGameToMap(map: Map<string, Map<string, number>>, pgn: string, color: RepColor): void {
    const parsed = new Chess();
    try {
        parsed.loadPgn(pgn);
    } catch {
        return; // skip unparseable games
    }
    const want = color === "white" ? "w" : "b";
    const replay = new Chess();
    for (const move of parsed.history({ verbose: true })) {
        if (move.color === want) {
            const key = positionKey(replay.fen());
            let inner = map.get(key);
            if (!inner) {
                inner = new Map();
                map.set(key, inner);
            }
            inner.set(move.san, (inner.get(move.san) ?? 0) + 1);
        }
        try {
            replay.move(move.san);
        } catch {
            break; // desync — stop replaying this game
        }
    }
}

/**
 * Build a chess.com player's repertoire for BOTH colors in one pass over their
 * monthly archives (newest-first, until the game/month cap is reached). A game
 * counts toward whichever color the player had, so the download happens once and
 * either color is ready instantly. Fetches archives sequentially (rate-limit
 * politeness) and yields to the UI between them, reporting progress.
 */
export async function buildChesscomRepertoire({
    username,
    maxGames = 10000,
    maxMonths = 36,
    onProgress,
    signal,
}: ChesscomBuildQuery): Promise<ChesscomBuildResult> {
    const white = new Map<string, Map<string, number>>();
    const black = new Map<string, Map<string, number>>();
    const target = username.toLowerCase();

    let archives: string[];
    try {
        const res = await fetch(`${CHESSCOM_BASE}/${encodeURIComponent(target)}/games/archives`, { signal });
        if (res.status === 404) return { white, black, gamesUsed: 0, status: "notfound" };
        if (!res.ok) return { white, black, gamesUsed: 0, status: "error", message: `archives request failed (${res.status})` };
        archives = ((await res.json()) as { archives: string[] }).archives ?? [];
    } catch (err) {
        if (signal?.aborted) return { white, black, gamesUsed: 0, status: "aborted" };
        return { white, black, gamesUsed: 0, status: "error", message: err instanceof Error ? err.message : "archives fetch failed" };
    }

    // Newest first, capped to the most recent maxMonths archives.
    const recent = archives.slice(-maxMonths).reverse();
    let gamesUsed = 0;

    for (let i = 0; i < recent.length; i++) {
        if (signal?.aborted) return { white, black, gamesUsed, status: "aborted" };
        try {
            const res = await fetch(recent[i], { signal });
            if (res.ok) {
                const games = ((await res.json()) as { games: ChesscomGame[] }).games ?? [];
                for (const g of games) {
                    if (g.rules !== "chess" || !g.pgn) continue;
                    const isWhite = g.white?.username?.toLowerCase() === target;
                    const isBlack = g.black?.username?.toLowerCase() === target;
                    if (isWhite) addGameToMap(white, g.pgn, "white");
                    else if (isBlack) addGameToMap(black, g.pgn, "black");
                    else continue;
                    gamesUsed++;
                    if (gamesUsed >= maxGames) break;
                }
            }
        } catch (err) {
            if (signal?.aborted) return { white, black, gamesUsed, status: "aborted" };
            // Skip a failed archive but keep going.
            void err;
        }
        onProgress?.({ gamesUsed, archivesDone: i + 1, archivesTotal: recent.length });
        if (gamesUsed >= maxGames) break;
        await sleep(0); // yield to the UI between archives
    }

    return { white, black, gamesUsed, status: "ok" };
}

/** Look up a built chess.com map for a position. */
export function lookup(map: Map<string, Map<string, number>>, fen: string): PlayerMovesResult {
    const inner = map.get(positionKey(fen));
    if (!inner || inner.size === 0) return { status: "none" };
    const moves = [...inner]
        .map(([san, count]) => ({ san, count }))
        .sort((a, b) => b.count - a.count);
    const total = moves.reduce((s, m) => s + m.count, 0);
    return { status: "ok", moves, total };
}
