import { useParams, Link } from 'react-router-dom';

// This would come from an API or data store in a real app
const articleContent: Record<string, { title: string; content: string }> = {
    '1': {
        title: 'A Bloated Mess',
        content: 'The latest season of the clive show takes a turn from green screen improv and live feats to mostly seated activities.',
    },
    '2': {
        title: 'Beware of "Coach"',
        content: 'Sometimes "free" coaching has strings attached!',
    },
    '3': {
        title: 'Healthy Body, Healthy Mind',
        content: 'Dr Mike delves into the details of how optimizing your fitness can pay dividens over the board.',
    },
    '4': {
        title: 'Head size closely linked to Intelligence',
        content: 'A recent study in rats has confirmed the long held notion that head size has a direct causal relationship with intelligence.',
    },
    '5': {
        title: 'Tactical Patterns Every Player Should Know',
        content: 'Forks, pins, skewers, and discovered attacks are the building blocks of chess tactics. Recognize these patterns to win material.',
    },
    '6': {
        title: 'How to Analyze Your Games',
        content: 'Post-game analysis is essential for improvement. Learn how to identify your mistakes and find better moves.',
    },
};

export default function Article() {
    const { id } = useParams<{ id: string }>();
    const article = id ? articleContent[id] : null;

    if (!article) {
        return (
            <div>
                <h1>Article not found</h1>
                <Link to="/home" style={{ color: '#007bff' }}>Back to Home</Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800 }}>
            <Link to="/" style={{ color: '#007bff', textDecoration: 'none', marginBottom: 16, display: 'inline-block' }}>
                ← Back to Articles
            </Link>
            <h1 style={{ marginTop: 16, marginBottom: 24 }}>{article.title}</h1>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>{article.content}</p>
        </div>
    );
}
