// Lichess Opening Explorer (lichess games database).
// Public endpoint — no auth required. Docs: https://lichess.org/api#tag/opening-explorer
const EXPLORER_URL = 'https://explorer.lichess.ovh/lichess';

export type Speed =
    | 'ultraBullet'
    | 'bullet'
    | 'blitz'
    | 'rapid'
    | 'classical'
    | 'correspondence';

// Lichess buckets games into these rating brackets. A request asks for a set of
// brackets; "2200+" means the 2200 and 2500 buckets.
export const RATING_BUCKETS = [0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500] as const;
export type RatingBucket = (typeof RATING_BUCKETS)[number];

// Return every bucket at or above `min` — i.e. a "min rating and up" filter.
export function bucketsAtLeast(min: RatingBucket): RatingBucket[] {
    return RATING_BUCKETS.filter((b) => b >= min);
}

export interface ExplorerMove {
    uci: string;
    san: string;
    white: number;
    draws: number;
    black: number;
    averageRating: number | null;
}

export interface ExplorerGameRef {
    id: string;
    winner: 'white' | 'black' | null;
    speed: Speed;
    white: { name: string; rating: number };
    black: { name: string; rating: number };
    year?: number;
    month?: string;
}

export interface ExplorerResponse {
    white: number;
    draws: number;
    black: number;
    moves: ExplorerMove[];
    topGames: ExplorerGameRef[];
    opening: { eco: string; name: string } | null;
}

export interface ExplorerQuery {
    fen: string;
    ratings: RatingBucket[];
    speeds: Speed[];
    signal?: AbortSignal;
}

export const DEFAULT_SPEEDS: Speed[] = ['blitz', 'rapid', 'classical'];
export const DEFAULT_MIN_RATING: RatingBucket = 2200;

// Lichess now requires authentication on the opening explorer (it returns 401
// otherwise). We send a Bearer token: an OAuth token set at runtime takes
// precedence (for a future lichess login flow), otherwise we fall back to a
// personal token supplied via VITE_LICHESS_TOKEN in .env.local for local dev.
let runtimeToken: string | null = null;

/** Set the lichess token at runtime (e.g. after an OAuth login). */
export function setLichessToken(token: string | null): void {
    runtimeToken = token;
}

export function getLichessToken(): string | undefined {
    return runtimeToken || (import.meta.env.VITE_LICHESS_TOKEN as string | undefined) || undefined;
}

/** Whether any lichess token is currently available. */
export function hasLichessToken(): boolean {
    return !!getLichessToken();
}

export class ExplorerAuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ExplorerAuthError';
    }
}

/**
 * Fetch opening statistics for a position. The explorer is rate-limited to
 * roughly one in-flight request, so callers should pass an AbortSignal and
 * cancel the previous request before issuing a new one. On HTTP 429 we retry
 * once after a short backoff.
 */
export async function fetchOpeningExplorer({
    fen,
    ratings,
    speeds,
    signal,
}: ExplorerQuery): Promise<ExplorerResponse> {
    const params = new URLSearchParams({
        variant: 'standard',
        fen,
        ratings: ratings.join(','),
        speeds: speeds.join(','),
        moves: '12',
        topGames: '4',
        recentGames: '0',
    });
    const url = `${EXPLORER_URL}?${params.toString()}`;

    const token = getLichessToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetch(url, { signal, headers });
        if (response.status === 429) {
            // Rate limited — back off briefly then retry once.
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
        }
        if (response.status === 401) {
            throw new ExplorerAuthError(
                token
                    ? 'Lichess rejected the token (401). Check that VITE_LICHESS_TOKEN is a valid lichess API token.'
                    : 'Lichess requires authentication for the opening explorer. Add a token to chess-app/.env.local as VITE_LICHESS_TOKEN and restart the dev server.',
            );
        }
        if (!response.ok) {
            throw new Error(`Opening explorer request failed (${response.status})`);
        }
        return (await response.json()) as ExplorerResponse;
    }
    throw new Error('Opening explorer is rate limited, please slow down.');
}
