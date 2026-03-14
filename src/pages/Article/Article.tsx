import { useParams, Link } from 'react-router-dom';
import articles from './articles';
import Comments from './components/Comments';

export default function Article() {
    const { id } = useParams<{ id: string }>();
    const article = id ? articles[id] : null;

    if (!article) {
        return (
            <div>
                <h1>Article not found</h1>
                <Link to="/news" style={{ color: '#007bff' }}>Back to News</Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800 }}>
            <Link to="/news" style={{ color: '#007bff', textDecoration: 'none', marginBottom: 16, display: 'inline-block' }}>
                ← Back to News
            </Link>
            <h1 style={{
                marginTop: 16,
                marginBottom: 24,
                fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
                fontWeight: 900,
            }}>{article.title}</h1>
            <hr style={{
                border: 'none',
                borderTop: '2px solid currentColor',
                marginBottom: 24,
            }} />
            {article.sections.map((section, i) => (
                <div key={i} style={{ marginBottom: 24 }}>
                    {section.images && (
                        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'flex-start' }}>
                            {section.images.map((img, j) => (
                                <figure key={j} style={{ margin: 0, flex: 1, maxWidth: `${100 / section.images!.length}%` }}>
                                    <img
                                        src={img.src}
                                        alt={img.caption ?? article.title}
                                        style={{ width: '100%', height: 350, objectFit: 'contain', borderRadius: 8 }}
                                    />
                                    {img.caption && (
                                        <figcaption style={{
                                            fontSize: '0.85rem',
                                            fontStyle: 'italic',
                                            opacity: 0.7,
                                            marginTop: 6,
                                            textAlign: 'center',
                                        }}>
                                            {img.caption}
                                        </figcaption>
                                    )}
                                </figure>
                            ))}
                        </div>
                    )}
                    {section.image && (
                        <figure style={{ margin: 0, marginBottom: 8 }}>
                            <img
                                src={section.image.src}
                                alt={section.image.caption ?? article.title}
                                style={{ width: '60%', borderRadius: 8, display: 'block', margin: '0 auto' }}
                            />
                            {section.image.caption && (
                                <figcaption style={{
                                    fontSize: '0.85rem',
                                    fontStyle: 'italic',
                                    opacity: 0.7,
                                    marginTop: 6,
                                    textAlign: 'center',
                                }}>
                                    {section.image.caption}
                                </figcaption>
                            )}
                        </figure>
                    )}
                    {section.text && (
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>
                            {section.text}
                        </p>
                    )}
                    {section.html && (
                        <p
                            style={{ fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}
                            dangerouslySetInnerHTML={{ __html: section.html }}
                        />
                    )}
                </div>
            ))}
            {article.author && (
                <div style={{
                    marginTop: 40,
                    paddingTop: 16,
                    borderTop: '1px solid rgba(128,128,128,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 12,
                }}>
                    {article.authorImage && (
                        <img
                            src={article.authorImage}
                            alt={article.author}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                objectFit: 'cover',
                            }}
                        />
                    )}
                    <span style={{
                        fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
                        fontStyle: 'italic',
                        fontSize: '1.1rem',
                    }}>
                        — {article.author}
                    </span>
                </div>
            )}
            {id && <Comments articleId={id} />}
        </div>
    );
}
