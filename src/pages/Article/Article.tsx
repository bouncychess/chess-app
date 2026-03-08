import { useParams, Link } from 'react-router-dom';
import articles from './articles';

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
            <h1 style={{ marginTop: 16, marginBottom: 24 }}>{article.title}</h1>
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
                </div>
            ))}
        </div>
    );
}
