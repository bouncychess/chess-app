const PROFILE_API_URL = import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:8002';

// username -> { tcKey -> rating }
export type PlayerRatings = Record<string, Record<string, number>>;

export async function fetchPlayerRatings(
    usernames: string[],
    signal?: AbortSignal,
): Promise<PlayerRatings> {
    if (usernames.length === 0) return {};

    const response = await fetch(`${PROFILE_API_URL}/api/v1/users/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames }),
        signal,
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch player ratings: ${response.status}`);
    }

    const data = await response.json();
    return data.ratings ?? {};
}
