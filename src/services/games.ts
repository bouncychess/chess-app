const PROFILE_API_URL = import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:8002';

export type GameHistoryItem = {
    game_id: string;
    white_username: string;
    black_username: string;
    result: 'white' | 'black' | 'draw' | null;
    end_reason: string | null;
    initial_time: number;
    increment: number;
    last_move_timestamp: number | null;
};

export async function getUserGames(username: string): Promise<GameHistoryItem[]> {
    const response = await fetch(
        `${PROFILE_API_URL}/api/v1/games/user/${encodeURIComponent(username)}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch game history');
    }

    const data: { games: GameHistoryItem[] } = await response.json();
    return data.games;
}
