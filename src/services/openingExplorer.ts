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

    for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetch(url, { signal });
        if (response.status === 429) {
            // Rate limited — back off briefly then retry once.
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
        }
        if (!response.ok) {
            throw new Error(`Opening explorer request failed (${response.status})`);
        }
        return (await response.json()) as ExplorerResponse;
    }
    throw new Error('Opening explorer is rate limited, please slow down.');
}
