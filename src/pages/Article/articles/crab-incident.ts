import type { ArticleData } from '../types';

const article: ArticleData = {
    title: 'The "Crab Incident"',
    author: 'Don Mahogey',
    authorImage: '/images/mahogey_0.png',
    sections: [
        {
            images: [
                { src: '/images/articles/crab_incident.png', caption: 'The Crab Incident' },
            ],
        },
        {
            html: 'A longtime Patreon supporter of the Clive Show has come forward with a deeply troubling account of their interactions with host Eric Clive behind the scenes. In a recently leaked direct message, we see yet another instance of Eric engaging in hateful and offensive rhetoric toward a loyal member of his own community.',
        },
        {
            html: 'Coming on the heels of the now-infamous <a href="/articles/elf_incident" style="color: #3b82f6; text-decoration: underline;">"Elf Incident"</a>, this latest revelation casts the Clive Show in an increasingly unfavorable light. Longtime viewers have begun to question whether Eric is fit to continue in his tenure as host, or if it time to go looking for a replacement.',
        },
    ],
};

export default article;
