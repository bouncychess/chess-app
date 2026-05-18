import { Link } from 'react-router-dom';
import { theme } from '../config/theme';

export type Article = {
    id: string;
    slug?: string;
    title: string;
    thumbnail: string;
    ratingAverage?: number | null;
    ratingCount?: number;
};

type ArticleCardProps = {
    article: Article;
    isDraft?: boolean;
};

const STAR_FILLED_COLOR = '#f59e0b';

function CardStars({ average, count }: { average: number | null | undefined; count: number | undefined }) {
    // Hide entirely when no ratings exist; the empty row would just be noise.
    if (!count) return null;
    const value = average ?? 0;
    return (
        <div style={{
            marginTop: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.85rem',
            color: theme.colors.placeholder,
        }}>
            <div style={{ display: 'flex', gap: 0, color: STAR_FILLED_COLOR, fontSize: '0.95rem', lineHeight: 1 }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} style={{ opacity: i <= Math.round(value) ? 1 : 0.25 }}>★</span>
                ))}
            </div>
            <span>
                <span style={{ color: theme.colors.cardText, fontWeight: 600 }}>{value.toFixed(1)}</span>
                {' '}({count})
            </span>
        </div>
    );
}

export default function ArticleCard({ article, isDraft }: ArticleCardProps) {
    const linkTo = isDraft
        ? `/articles/editor/${article.id}`
        : `/articles/${article.slug || article.id}`;

    return (
        <Link
            to={linkTo}
            style={{
                display: 'block',
                textDecoration: 'none',
                color: theme.colors.cardText,
                backgroundColor: theme.colors.cardBackground,
                borderRadius: 8,
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                position: 'relative',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
        >
            {isDraft && (
                <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: '#f59e0b',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    zIndex: 1,
                }}>
                    Draft
                </div>
            )}
            <div style={{
                width: '100%',
                paddingTop: '100%',
                position: 'relative',
            }}>
                {article.thumbnail ? (
                    <img
                        src={article.thumbnail}
                        alt={article.title}
                        loading="lazy"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                ) : (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: theme.colors.border,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        opacity: 0.4,
                    }}>
                        No Image
                    </div>
                )}
            </div>
            <div style={{ padding: 12 }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{article.title}</h3>
                {!isDraft && (
                    <CardStars average={article.ratingAverage} count={article.ratingCount} />
                )}
            </div>
        </Link>
    );
}
