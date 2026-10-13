import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Email preferences | avrxt', description: 'Manage your avrxt newsletter subscription privately.', robots: { index: false, follow: false }, referrer: 'same-origin' };
export default function PreferenceLayout({ children }: { children: React.ReactNode }) { return children; }
