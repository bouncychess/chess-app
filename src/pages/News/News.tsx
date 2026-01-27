import ArticleCard, { type Article } from '../../components/ArticleCard';

// Sample articles - replace with real data later
const articles: Article[] = [
    { id: '1', title: 'A Bloated Mess', thumbnail: '/images/articles/bloated_mess.png' },
    { id: '5', title: 'Tactical Patterns Every Player Should Know', thumbnail: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=400' },
    { id: '2', title: 'Beware of "Coach"', thumbnail: '/images/articles/homeless_bouncy.png' },
    { id: '3', title: 'Healthy Body, Healthy Mind', thumbnail: '/images/articles/mike.png' },
    { id: '6', title: 'How to Analyze Your Games', thumbnail: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=400' },
    { id: '4', title: 'Head Size Closely Linked to Intelligence', thumbnail: '/images/articles/clive_head.jpg' },
];

export default function News() {
    return (
        <div>
            <h1 style={{ marginTop: 0, marginBottom: 24 }}>Fresh off the Press!</h1>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 20,
            }}>
                {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                ))}
            </div>
        </div>
    );
}
