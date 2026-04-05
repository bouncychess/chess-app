import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Comments from './components/Comments';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/buttons/Button';
import { getArticle, type ArticleDetail } from '../../services/articles';

export default function Article() {
    const { id } = useParams<{ id: string }>();
    const { role, user } = useAuth();
    const { theme } = useTheme();
    const [article, setArticle] = useState<ArticleDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            try {
                const data = await getArticle(id);
                if (!cancelled) setArticle(data);
            } catch {
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    if (loading) {
        return <div style={{ padding: 32, color: theme.colors.text }}>Loading...</div>;
    }

    if (error || !article) {
        return (
            <div>
                <h1>Article not found</h1>
                <Link to="/news" style={{ color: theme.colors.link }}>Back to News</Link>
            </div>
        );
    }

    const cleanHtml = DOMPurify.sanitize(article.content, {
        ADD_TAGS: ['img'],
        ADD_ATTR: ['src', 'alt', 'style', 'class', 'href', 'target'],
    });

    const publishedDate = new Date(article.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Link to="/news" style={{ color: theme.colors.link, textDecoration: 'none' }}>
                    &larr; Back to News
                </Link>
                {(role === 'admin' || (role === 'staff' && user?.username === article.author_username)) && (
                    <Link to={`/articles/editor/${article.article_id}`} style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm">Edit</Button>
                    </Link>
                )}
            </div>

            <h1 style={{
                marginTop: 16,
                marginBottom: 8,
                fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
                fontWeight: 900,
                color: theme.colors.text,
            }}>
                {article.title}
            </h1>

            <div style={{
                fontSize: '0.85rem',
                color: theme.colors.placeholder,
                marginBottom: 24,
            }}>
                By <Link to={`/user/${article.author_username}`} style={{ color: theme.colors.link }}>{article.author_username}</Link> &middot; {publishedDate}
                {article.status === 'draft' && (
                    <span style={{
                        marginLeft: 12,
                        backgroundColor: '#f59e0b',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                    }}>
                        Draft
                    </span>
                )}
            </div>

            <hr style={{ border: 'none', borderTop: '2px solid currentColor', marginBottom: 24 }} />

            {/* Rendered article content */}
            <div
                className="article-content"
                style={{
                    fontSize: '1.1rem',
                    lineHeight: 1.7,
                    color: theme.colors.text,
                }}
                dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />

            {id && <Comments articleId={id} />}
        </div>
    );
}
