import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:8002';

export type Comment = {
    comment_id: string;
    username: string;
    text: string;
    created_at: string;
};

export async function getComments(articleId: string): Promise<Comment[]> {
    const response = await fetch(
        `${API_URL}/api/v1/articles/${encodeURIComponent(articleId)}/comments`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch comments');
    }

    return response.json();
}

export async function addComment(articleId: string, text: string): Promise<Comment> {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(
        `${API_URL}/api/v1/articles/${encodeURIComponent(articleId)}/comments`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ text }),
        }
    );

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Guests cannot post comments');
        }
        throw new Error('Failed to add comment');
    }

    return response.json();
}

export async function deleteComment(articleId: string, commentId: string): Promise<void> {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(
        `${API_URL}/api/v1/articles/${encodeURIComponent(articleId)}/comments/${encodeURIComponent(commentId)}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('You can only delete your own comments');
        }
        throw new Error('Failed to delete comment');
    }
}
