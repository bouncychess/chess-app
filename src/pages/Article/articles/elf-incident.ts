import type { ArticleData } from '../types';

const article: ArticleData = {
    title: 'The "Elf Incident"',
    sections: [
        {
            images: [
                { src: '/images/articles/clive_elf.png', caption: 'A Young Eric Clive' },
                { src: '/images/articles/elf_incident_0.png', caption: 'Gorey Hole' },
            ],
        },
        {
            text: 'The hardest part of lying is keeping the story straight.  For years Eric kept the incident a secret, presenting his side of the story, but the questions always remained.  A streaming career on hiatus, a relationship destroyed.  The fans left with nothing more than fragments to piece together.',
        },
        {
            text: 'Under mounting criticism, Eric finally cracked under the pressure, and what followed cast the whole incident in a different light. A story of gaslighting, manipulation, and deceit — painting Clive not as the victim he long claimed to be, but as the instigator. We present the evidence below - draw your own conclusions.',
        },
        {
            image: {
                src: '/images/articles/elf_incident_1.png',
            },
        },
        {
            image: {
                src: '/images/articles/elf_incident_2.png',
            },
        },
        {
            image: {
                src: '/images/articles/elf_incident_3.png',
            },
        },
    ],
};

export default article;
