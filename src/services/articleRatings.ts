import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:8002';

export type ArticleRatingSummary = {
    average: number | null;
    count: number;
};

export type MyArticleRating = {
    stars: number | null;
};

async function getAuthToken(): Promise<string | null> {
    try {
        const session = await fetchAuthSession();
        return session.tokens?.idToken?.toString() ?? null;
    } catch {
        return null;
    }
}

export async function getArticleRatingSummary(articleId: string): Promise<ArticleRatingSummary> {
    const response = await fetch(
        `${API_URL}/api/v1/articles/${encodeURIComponent(articleId)}/ratings/summary`,
    );
    if (!response.ok) throw new Error('Failed to fetch rating summary');
    return response.json();
}

export async function getMyArticleRating(articleId: string): Promise<MyArticleRating> {
    const token = await getAuthToken();
    if (!token) return { stars: null };
    const response = await fetch(
        `${API_URL}/api/v1/articles/${encodeURIComponent(articleId)}/ratings/me`,
        { headers: { Authorization: `Bearer ${token}` } },
    );
    // 401 = not authed; just report "no rating" instead of throwing so the
    // widget can still render the public summary alongside.
    if (response.status === 401) return { stars: null };
    if (!response.ok) throw new Error('Failed to fetch your rating');
    return response.json();
}

export async function submitArticleRating(articleId: string, stars: number): Promise<void> {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const response = await fetch(
        `${API_URL}/api/v1/articles/${encodeURIComponent(articleId)}/ratings`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ stars }),
        },
    );
    if (!response.ok) {
        if (response.status === 403) throw new Error('Guests cannot rate articles');
        throw new Error('Failed to submit rating');
    }
}
