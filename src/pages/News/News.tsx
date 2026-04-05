import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArticleCard from '../../components/ArticleCard';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/buttons/Button';
import { getArticles, type ArticleSummary } from '../../services/articles';

export default function News() {
    const { role } = useAuth();
    const { theme } = useTheme();
    const [articles, setArticles] = useState<ArticleSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const isStaffOrAdmin = role === 'admin' || role === 'staff';

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getArticles();
                if (!cancelled) setArticles(data);
            } catch (err) {
                console.error('Failed to load articles:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const published = articles.filter(a => a.status === 'published');
    const drafts = articles.filter(a => a.status === 'draft');

    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
                {isStaffOrAdmin && (
                    <Link to="/articles/editor" style={{ textDecoration: 'none', position: 'absolute', top: 0, left: 0 }}>
                        <Button variant="danger" size="md"><span style={{lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>Author Article</span></Button>
                    </Link>
                )}
                <h1 style={{
                    marginTop: 0,
                    marginBottom: 4,
                    fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
                    fontSize: '3rem',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                }}>
                    Daily Tard
                </h1>
                <div style={{
                    borderTop: '3px double currentColor',
                    borderBottom: '3px double currentColor',
                    padding: '4px 0',
                    fontSize: '0.75rem',
                    fontFamily: '"Georgia", "Times New Roman", serif',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                }}>
                    All the news that&apos;s fit to print
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 48, color: theme.colors.placeholder }}>
                    Loading articles...
                </div>
            ) : (
                <>
                    {/* Drafts section for staff/admin */}
                    {isStaffOrAdmin && drafts.length > 0 && (
                        <>
                            <h2 style={{
                                fontSize: '1.2rem',
                                fontFamily: '"Georgia", "Times New Roman", serif',
                                marginBottom: 16,
                                color: theme.colors.placeholder,
                            }}>
                                Your Drafts
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 20,
                                marginBottom: 32,
                            }}>
                                {drafts.map((article) => (
                                    <ArticleCard
                                        key={article.article_id}
                                        article={{
                                            id: article.article_id,
                                            slug: article.slug,
                                            title: article.title,
                                            thumbnail: article.preview_image_url || '/images/articles/placeholder.png',
                                        }}
                                        isDraft
                                    />
                                ))}
                            </div>
                            <hr style={{ border: 'none', borderTop: '2px solid currentColor', marginBottom: 24 }} />
                        </>
                    )}

                    {/* Published articles */}
                    {published.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 48, color: theme.colors.placeholder }}>
                            No articles yet.
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 20,
                        }}>
                            {published.map((article) => (
                                <ArticleCard
                                    key={article.article_id}
                                    article={{
                                        id: article.article_id,
                                        slug: article.slug,
                                        title: article.title,
                                        thumbnail: article.preview_image_url || '',
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
