export type ArticleImage = {
    src: string;
    caption?: string;
};

export type ArticleSection = {
    text?: string;
    image?: ArticleImage;
    images?: ArticleImage[];
};

export type ArticleData = {
    title: string;
    author?: string;
    authorImage?: string;
    sections: ArticleSection[];
};
