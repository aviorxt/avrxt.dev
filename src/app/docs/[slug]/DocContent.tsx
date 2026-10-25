import { renderMarkdown } from '@/lib/render-markdown';

export default async function DocContent({ content }: { content: string }) {
    const html = await renderMarkdown(content);
    return <div className="doc-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
