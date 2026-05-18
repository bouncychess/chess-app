import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import {
    getArticleRatingSummary,
    getMyArticleRating,
    submitArticleRating,
    type ArticleRatingSummary,
} from '../../../services/articleRatings';

interface StarRatingProps {
    articleId: string;
}

const STAR_FILLED_COLOR = '#f59e0b';
const STAR_COUNT = 5;

export default function StarRating({ articleId }: StarRatingProps) {
    const { user, isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const [summary, setSummary] = useState<ArticleRatingSummary>({ average: null, count: 0 });
    const [myStars, setMyStars] = useState<number | null>(null);
    const [hoverStars, setHoverStars] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Guests have usernames like "guest_*" — same gating rule as the backend.
    const canRate = isAuthenticated && !user?.username?.startsWith('guest_');

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        Promise.all([
            getArticleRatingSummary(articleId).catch(() => ({ average: null, count: 0 })),
            canRate
                ? getMyArticleRating(articleId).catch(() => ({ stars: null }))
                : Promise.resolve({ stars: null as number | null }),
        ]).then(([s, mine]) => {
            if (cancelled) return;
            setSummary(s);
            setMyStars(mine.stars);
        }).finally(() => {
            if (!cancelled) setIsLoading(false);
        });
        return () => { cancelled = true; };
    }, [articleId, canRate]);

    const handleClick = async (stars: number) => {
        if (!canRate || isSubmitting) return;
        const prevMine = myStars;
        // Optimistic update — roll back on error.
        setMyStars(stars);
        setError(null);
        setIsSubmitting(true);
        try {
            await submitArticleRating(articleId, stars);
            const fresh = await getArticleRatingSummary(articleId);
            setSummary(fresh);
        } catch (err) {
            setMyStars(prevMine);
            setError(err instanceof Error ? err.message : 'Failed to submit rating');
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayed = hoverStars ?? myStars ?? 0;

    return (
        <div style={{ marginTop: 32, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div
                    style={{ display: 'flex', gap: 2 }}
                    onMouseLeave={() => setHoverStars(null)}
                >
                    {Array.from({ length: STAR_COUNT }, (_, i) => {
                        const value = i + 1;
                        const filled = value <= displayed;
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => handleClick(value)}
                                onMouseEnter={() => canRate && setHoverStars(value)}
                                disabled={!canRate || isSubmitting}
                                aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 2,
                                    cursor: canRate ? 'pointer' : 'default',
                                    color: filled ? STAR_FILLED_COLOR : theme.colors.placeholder,
                                    fontSize: '1.5rem',
                                    lineHeight: 1,
                                    transition: 'color 0.1s ease',
                                }}
                            >
                                {filled ? '★' : '☆'}
                            </button>
                        );
                    })}
                </div>
                <div style={{ fontSize: '0.875rem', color: theme.colors.placeholder }}>
                    {isLoading ? (
                        'Loading…'
                    ) : summary.count === 0 ? (
                        'No ratings yet'
                    ) : (
                        <>
                            <span style={{ color: theme.colors.text, fontWeight: 600 }}>
                                {(summary.average ?? 0).toFixed(1)} ★
                            </span>
                            {' '}({summary.count} rating{summary.count === 1 ? '' : 's'})
                        </>
                    )}
                </div>
            </div>
            {!canRate && !isLoading && (
                <div style={{ marginTop: 6, fontSize: '0.8rem', color: theme.colors.placeholder }}>
                    Sign in to rate this article.
                </div>
            )}
            {error && (
                <div style={{ marginTop: 6, fontSize: '0.8rem', color: theme.colors.danger }}>
                    {error}
                </div>
            )}
        </div>
    );
}
