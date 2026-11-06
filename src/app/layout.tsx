import type { Metadata, Viewport } from "next";
import { Inter, Space_Mono, Outfit, Instrument_Serif } from "next/font/google";
import OptionalAnalytics from '@/components/OptionalAnalytics';
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import CookieBanner from "@/components/CookieBanner";
import { ogSize } from "@/lib/og-image";
import { SITE_LOCALE, SITE_NAME, SITE_URL } from '@/lib/site-config';
import { SITE_TITLE, SITE_DESCRIPTION, personSchema, websiteSchema, serializeJsonLd } from '@/lib/site-identity';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

const siteFavicon = "/brand/avrxt-selected/favicon.ico";
const metadataBase = new URL(SITE_URL);

const openGraphImage = {
  url: "/opengraph-image",
  width: ogSize.width,
  height: ogSize.height,
  alt: "avrxt.dev preview image",
} as const;

const twitterImage = {
  url: "/twitter-image",
  width: ogSize.width,
  height: ogSize.height,
  alt: "avrxt.dev preview image",
} as const;

export const metadata: Metadata = {
  metadataBase,
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: "%s",
  },
  description: SITE_DESCRIPTION,
  keywords: ["avrxt", "aviorxt", "independent developer India", "aircraft maintenance engineer", "full stack developer", "web security", "API development", "AI automation"],
  authors: [{ name: "avrxt (aviorxt)", url: "/about" }],
  creator: "avrxt",
  publisher: "avrxt",
  category: "technology",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AVRXT" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  icons: {
    icon: [
      { url: siteFavicon, type: "image/x-icon", sizes: "16x16 32x32 48x48 64x64 128x128 256x256" },
      { url: "/brand/avrxt-selected/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/avrxt-selected/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/avrxt-selected/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [siteFavicon],
    apple: [{ url: "/brand/avrxt-selected/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    images: [openGraphImage],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [twitterImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} ${spaceMono.variable} ${outfit.variable} ${instrumentSerif.variable} theme-v7 font-sans bg-[#050505] text-white selection:bg-cyan-300/20 overflow-x-clip`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({ '@context': 'https://schema.org', '@graph': [websiteSchema, personSchema] }),
          }}
        />
        <SiteChrome position="before" />
        <main className="relative z-10 min-h-screen">
          {children}
        </main>
        <SiteChrome position="after" />
        <CookieBanner />
        <OptionalAnalytics />
      </body>
    </html>
  );
}
