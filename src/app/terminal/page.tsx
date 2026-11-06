import { buildPageMetadata } from '@/lib/page-metadata';
import { tools } from '@/lib/tool-catalog';
import { TERMINAL_PAGES, type TerminalPage } from '@/lib/terminal';
import TerminalClient from './TerminalClient';

export const revalidate = 60;
export const metadata = buildPageMetadata({ title: 'Terminal', description: 'Explore AVRXT with a browser terminal. Find public pages, published notes, utilities, and contact links using simple commands.', path: '/terminal', keywords: ['avrxt terminal', 'website commands', 'interactive terminal'] });

export default async function TerminalPage() {
  const pages: TerminalPage[] = [
    ...TERMINAL_PAGES,
    ...tools.map(tool => ({ command: tool.slug, title: tool.title, description: tool.description, href: `/tools/${tool.slug}`, group: 'tools' as const })),
  ];
  return <TerminalClient pages={pages} />;
}
