import { buildPageMetadata } from '@/lib/page-metadata';
import DiagramClient from './DiagramClient';

export const metadata = buildPageMetadata({
  title: 'System Diagram',
  description: 'An interactive overview of the public AVRXT web platform and its connected services.',
  path: '/diagram',
  noIndex: true,
});

export default function DigramPage() {
  return <DiagramClient />;
}
