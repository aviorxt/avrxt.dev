import { buildPageMetadata } from '@/lib/page-metadata';

export const metadata = buildPageMetadata({
  title: 'Login',
  description: 'Authenticate with Discord to access protected administrator experiences.',
  keywords: ['login', 'auth', 'github', 'discord', 'avrxt'],
  noIndex: true,
  path: '/auth/login',
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

