import { Link } from 'react-router-dom';
import { theme } from '../config/theme';

export type Article = {
    id: string;
    title: string;
    thumbnail: string;
};

type ArticleCardProps = {
    article: Article;
};

export default function ArticleCard({ article }: ArticleCardProps) {
    return (
        <Link
            to={`/articles/${article.id}`}
            style={{
                display: 'block',
                textDecoration: 'none',
                color: theme.colors.cardText,
                backgroundColor: theme.colors.cardBackground,
                borderRadius: 8,
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
            <div style={{
                width: '100%',
                paddingTop: '100%',
                position: 'relative',
            }}>
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
            </div>
            <div style={{ padding: 12 }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{article.title}</h3>
            </div>
        </Link>
    );
}
