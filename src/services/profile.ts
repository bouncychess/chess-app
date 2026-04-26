import { fetchAuthSession } from 'aws-amplify/auth';

const PROFILE_API_URL = import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:8002';

export type UserRole = 'admin' | 'staff';

// Matches chess-service's RatingEntry shape on the wire. We keep `rd` because
// the Profile page may eventually want to render an uncertainty indicator;
// other surfaces only need `rating` + `games_played`.
export type RatingEntry = {
    rating: number;
    rd: number;
    volatility: number;
    games_played: number;
    last_update?: string;
};

export type UserProfile = {
    username: string;
    ratings: Record<string, RatingEntry>;
    profile_details: string | null;
    role: UserRole | null;
};

// Returns the rating for a given TC key, defaulting to 0 for unplayed TCs
// (matches the "all 6 TCs default to 0" UX requirement).
export function getRating(profile: UserProfile, key: string): number {
    return profile.ratings?.[key]?.rating ?? 0;
}

export function getGamesPlayed(profile: UserProfile, key: string): number {
    return profile.ratings?.[key]?.games_played ?? 0;
}

export type UserProfileUpdate = {
    profile_details: string | null;
};

export async function getUserProfile(username: string): Promise<UserProfile> {
    const response = await fetch(
        `${PROFILE_API_URL}/api/v1/users/${encodeURIComponent(username)}`
    );

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('User not found');
        }
        if (response.status === 403) {
            throw new Error('Guests cannot have profiles');
        }
        throw new Error('Failed to fetch profile');
    }

    return response.json();
}

export async function updateUserProfile(
    username: string,
    update: UserProfileUpdate
): Promise<UserProfile> {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(
        `${PROFILE_API_URL}/api/v1/users/${encodeURIComponent(username)}`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(update),
        }
    );

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Guests cannot update profiles');
        }
        throw new Error('Failed to update profile');
    }

    return response.json();
}

export async function assignUserRole(
    username: string,
    role: UserRole | null
): Promise<UserProfile> {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(
        `${PROFILE_API_URL}/api/v1/users/${encodeURIComponent(username)}/role`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ role }),
        }
    );

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Admin access required');
        }
        if (response.status === 404) {
            throw new Error('User not found');
        }
        throw new Error('Failed to assign role');
    }

    return response.json();
}
