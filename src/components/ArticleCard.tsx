import { Link } from 'react-router-dom';
import { theme } from '../config/theme';

export type Article = {
    id: string;
    slug?: string;
    title: string;
    thumbnail: string;
};

type ArticleCardProps = {
    article: Article;
    isDraft?: boolean;
};

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
            </div>
        </Link>
    );
}
