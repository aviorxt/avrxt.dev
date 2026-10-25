export interface DocArticle {
    id: string;
    slug: string;
    category: string;
    title: string;
    description: string;
    content: string; // Markdown content
    date: string;
    color: 'blue' | 'cyan' | 'purple' | 'green' | 'orange' | 'pink';
    published: boolean;
    author?: string;
    tags?: string[];
    lastModified?: string;
    last_modified?: string;
    created_at?: string;
}
