import { buildPageMetadata } from '@/lib/page-metadata';
import { getPublicDocuments } from '@/lib/public-data';
import { tools } from '@/lib/tool-catalog';
import { TERMINAL_PAGES, type TerminalPage } from '@/lib/terminal';
import TerminalClient from './TerminalClient';

export const revalidate = 60;
export const metadata = buildPageMetadata({ title: 'Terminal', description: 'Explore AVRXT with a browser terminal. Find public pages, published notes, utilities, and contact links using simple commands.', path: '/terminal', keywords: ['avrxt terminal', 'website commands', 'interactive terminal'] });

export default async function TerminalPage() {
  const documents = await getPublicDocuments().catch(() => []);
  const pages: TerminalPage[] = [
    ...TERMINAL_PAGES,
    ...tools.map(tool => ({ command: tool.slug, title: tool.title, description: tool.description, href: `/tools/${tool.slug}`, group: 'tools' as const })),
    ...documents.filter(doc => doc.published && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(doc.slug) && doc.slug.length <= 100 && doc.slug.toLowerCase() !== 'admin').slice(0, 100).map(doc => ({
      command: `doc:${doc.slug.toLowerCase()}`, title: doc.title.slice(0, 160), description: (doc.description || 'Published note.').slice(0, 300), href: `/docs/${encodeURIComponent(doc.slug)}`, group: 'docs' as const,
    })),
  ];
  return <TerminalClient pages={pages} />;
}
