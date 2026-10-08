import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ToolClient from '@/components/tools/ToolClient';
import { getTool, tools } from '@/lib/tool-catalog';

export function generateStaticParams() {
  return tools.map(({ slug }) => ({ tool: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return {
    title: `${tool.title} | avrxt tools`,
    description: tool.description,
    alternates: { canonical: `/tools/${tool.slug}` },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  return <ToolClient slug={tool.slug} />;
}
