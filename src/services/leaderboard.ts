const PROFILE_API_URL = import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:8002';

export type LeaderboardEntry = {
    rank: number;
    username: string;
    rating: number;
    games_played: number;
};

export type LeaderboardResponse = {
    limit: number;
    // tcKey -> ranked list (top-N, descending by rating)
    leaderboards: Record<string, LeaderboardEntry[]>;
};

export async function fetchLeaderboard(
    limit: number = 10,
    signal?: AbortSignal,
): Promise<LeaderboardResponse> {
    const response = await fetch(`${PROFILE_API_URL}/api/v1/leaderboard?limit=${limit}`, {
        signal,
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
    }

    return response.json();
}
