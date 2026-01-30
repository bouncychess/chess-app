const PROFILE_API_URL = import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:8002';

export type UserProfile = {
    username: string;
    rating: number;
    profile_details: string | null;
};

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
    const response = await fetch(
        `${PROFILE_API_URL}/api/v1/users/${encodeURIComponent(username)}`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
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
