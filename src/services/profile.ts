import { fetchAuthSession } from 'aws-amplify/auth';

const PROFILE_API_URL = import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:8002';

export type UserRole = 'admin' | 'staff';

export type UserProfile = {
    username: string;
    rating: number;
    profile_details: string | null;
    role: UserRole | null;
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
