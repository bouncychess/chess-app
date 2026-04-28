import { fetchAuthSession } from 'aws-amplify/auth';

const PROFILE_API_URL = import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:8002';

export type ChatEntry = {
    username: string;
    message: string;
    isSystem?: boolean | null;
};

export type GameHistoryItem = {
    game_id: string;
    white_username: string;
    black_username: string;
    result: 'white' | 'black' | 'draw' | null;
    end_reason: string | null;
    initial_time: number;
    increment: number;
    last_move_timestamp: number | null;
    pgn?: string | null;
    fen?: string | null;
    white_time_remaining?: number | null;
    black_time_remaining?: number | null;
    chat?: ChatEntry[];
    white_rating_before?: number | null;
    white_rating_after?: number | null;
    black_rating_before?: number | null;
    black_rating_after?: number | null;
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

// Returns the persisted game record, or null if chess-service has no row for
// this id (404). Throws on other errors. Used as a fallback when chess-play
// has expired the game from memory.
export async function getGame(gameId: string): Promise<GameHistoryItem | null> {
    const response = await fetch(
        `${PROFILE_API_URL}/api/v1/games/${encodeURIComponent(gameId)}`
    );

    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        throw new Error('Failed to fetch game');
    }
    return await response.json();
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
