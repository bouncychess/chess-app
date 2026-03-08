import ArticleCard, { type Article } from '../../components/ArticleCard';


const featuredArticle: Article = {
    id: 'elf_incident', title: 'The "Elf Incident"', thumbnail: '/images/articles/clive_elf.png',
};

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
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{
                    marginTop: 0,
                    marginBottom: 4,
                    fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
                    fontSize: '3rem',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                }}>
                    The Daily Tard
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ width: 'calc((100% - 40px) / 3)' }}>
                    <ArticleCard article={featuredArticle} />
                </div>
            </div>
            <hr style={{
                border: 'none',
                borderTop: '2px solid currentColor',
                marginBottom: 24,
            }} />
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
