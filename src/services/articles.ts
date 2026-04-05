import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:8002';

export type ArticleStatus = 'draft' | 'published';

export type ArticleSummary = {
    article_id: string;
    slug: string;
    title: string;
    author_username: string;
    preview_image_url: string | null;
    status: ArticleStatus;
    created_at: string;
    updated_at: string;
};

export type ArticleDetail = ArticleSummary & {
    content: string;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) throw new Error('Not authenticated');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

export async function getArticles(): Promise<ArticleSummary[]> {
    try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/api/v1/articles`, { headers });
        if (!response.ok) throw new Error('Failed to fetch articles');
        return response.json();
    } catch {
        // If auth fails, fetch without auth (public only)
        const response = await fetch(`${API_URL}/api/v1/articles`);
        if (!response.ok) throw new Error('Failed to fetch articles');
        return response.json();
    }
}

export async function getArticle(articleId: string): Promise<ArticleDetail> {
    try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/api/v1/articles/${encodeURIComponent(articleId)}`, { headers });
        if (!response.ok) throw new Error('Failed to fetch article');
        return response.json();
    } catch {
        const response = await fetch(`${API_URL}/api/v1/articles/${encodeURIComponent(articleId)}`);
        if (!response.ok) throw new Error('Failed to fetch article');
        return response.json();
    }
}

export async function createArticle(data: {
    title: string;
    content: string;
    preview_image_url?: string | null;
    status: ArticleStatus;
}): Promise<ArticleDetail> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/articles`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to create article' }));
        throw new Error(error.detail || 'Failed to create article');
    }
    return response.json();
}

export async function updateArticle(articleId: string, data: {
    title?: string;
    content?: string;
    preview_image_url?: string | null;
    status?: ArticleStatus;
}): Promise<ArticleDetail> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/articles/${encodeURIComponent(articleId)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to update article' }));
        throw new Error(error.detail || 'Failed to update article');
    }
    return response.json();
}

export async function deleteArticle(articleId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/articles/${encodeURIComponent(articleId)}`, {
        method: 'DELETE',
        headers,
    });
    if (!response.ok) throw new Error('Failed to delete article');
}

export async function getImageUploadUrl(
    filename: string,
    contentType: string,
    articleId?: string,
): Promise<{ upload_url: string; image_url: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/articles/images`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ filename, content_type: contentType, article_id: articleId }),
    });
    if (!response.ok) throw new Error('Failed to get upload URL');
    return response.json();
}

export async function uploadImageToS3(presignedUrl: string, file: File): Promise<void> {
    const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
    });
    if (!response.ok) throw new Error('Failed to upload image');
}
