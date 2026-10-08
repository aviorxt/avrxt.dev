import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ToolClient from '@/components/tools/ToolClient';
import { getTool, tools } from '@/lib/tool-catalog';
import { buildPageMetadata } from '@/lib/page-metadata';

export function generateStaticParams() {
  return tools.map(({ slug }) => ({ tool: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return buildPageMetadata({
    title: `${tool.title} — Free Online Tool`,
    description: tool.description,
    keywords: [tool.title, tool.shortTitle, tool.eyebrow, 'free online tool', 'avrxt tools', 'aviorxt'],
    path: `/tools/${tool.slug}`,
  });
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  return <ToolClient slug={tool.slug} />;
}
