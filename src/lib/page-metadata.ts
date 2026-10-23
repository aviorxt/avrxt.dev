import type { Metadata } from 'next';
import { ogSize } from '@/lib/og-image';
import { SITE_LOCALE, SITE_NAME, SITE_URL } from '@/lib/site-config';

type PageMetadataInput = {
  title: string;
  description: string;
  keywords?: string[];
  noIndex?: boolean;
  path?: string;
};

const SITE_TITLE_TOKEN = 'avrxt';

function withSiteSuffix(title: string) {
  const normalized = title.trim();
  if (!normalized) return SITE_TITLE_TOKEN;
  if (normalized.toLowerCase().includes(SITE_TITLE_TOKEN)) return normalized;
  return `${normalized} | ${SITE_TITLE_TOKEN}`;
}

export function buildPageMetadata({
  title,
  description,
  keywords,
  noIndex,
  path,
}: PageMetadataInput): Metadata {
  const fullTitle = withSiteSuffix(title);
  const normalizedDescription = description.trim();

  const normalizedPath = path?.trim();
  const effectivePath = normalizedPath && normalizedPath.startsWith('/') ? normalizedPath : undefined;
  const canonicalUrl = effectivePath ? new URL(effectivePath, SITE_URL).toString() : undefined;
  const ogVersion =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.NEXT_PUBLIC_OG_VERSION ||
    'dev';

  const imageUrl = effectivePath
    ? `/api/og?${new URLSearchParams({ path: effectivePath, v: ogVersion }).toString()}`
    : '/opengraph-image';

  const openGraphImage = {
    url: imageUrl,
    width: ogSize.width,
    height: ogSize.height,
    alt: `${fullTitle} — social preview`,
  } as const;

  const metadata: Metadata = {
    title: fullTitle,
    description: normalizedDescription,
    keywords,
    authors: [{ name: 'avrxt (aviorxt)', url: '/about' }],
    creator: 'avrxt',
    publisher: 'avrxt',
    category: 'technology',
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      title: fullTitle,
      description: normalizedDescription,
      type: 'website',
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      images: [openGraphImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: normalizedDescription,
      images: [
        {
          url: imageUrl,
          width: ogSize.width,
          height: ogSize.height,
          alt: `${fullTitle} — social preview`,
        },
      ],
    },
  };

  return metadata;
}

