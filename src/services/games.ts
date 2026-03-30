import { fetchAuthSession } from 'aws-amplify/auth';

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

export async function hideGame(gameId: string): Promise<void> {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(
        `${PROFILE_API_URL}/api/v1/games/${encodeURIComponent(gameId)}/hide`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Staff or admin access required');
        }
        throw new Error('Failed to hide game');
    }
}
