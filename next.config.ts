import type { NextConfig } from "next";

const isVercelPreview = process.env.VERCEL_ENV === 'preview';
const isDevelopment = process.env.NODE_ENV === 'development';
const previewScriptSources = isVercelPreview ? ' https://vercel.live' : '';
const previewFrameSources = isVercelPreview ? ' https://vercel.live' : '';
const developmentScriptSources = isDevelopment ? " 'unsafe-eval'" : '';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com https://cdn.jsdelivr.net https://static.cloudflareinsights.com${developmentScriptSources}${previewScriptSources}`,
  `script-src-elem 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com https://cdn.jsdelivr.net https://static.cloudflareinsights.com${previewScriptSources}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "worker-src 'self' blob:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  `connect-src 'self' https:${process.env.NEXT_PUBLIC_SUPABASE_URL ? ` ${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin.replace(/^https:/, 'wss:')}` : ''}`,
  `frame-src 'self' https://open.spotify.com https://www.youtube-nocookie.com${previewFrameSources}`,
  "upgrade-insecure-requests",
].join('; ');

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: 'security',
  },
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/preferance/mail/unsub/:path*', destination: '/preference/mail/unsub/:path*', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      { source: '/portfolio', destination: '/', permanent: true },
      { source: '/gallery/:path*', destination: '/', permanent: true },
      { source: '/galleery/:path*', destination: '/', permanent: true },
      { source: '/hireme', destination: '/contact', permanent: true },
      { source: '/privacy', destination: '/legal/privacy', permanent: true },
      { source: '/terms', destination: '/legal/terms', permanent: true },
      { source: '/security', destination: '/legal/security', permanent: true },
      { source: '/refund', destination: '/legal/refund', permanent: true },
      { source: '/assets', destination: '/legal/assets', permanent: true },
      { source: '/assests/logo/:path*', destination: '/assets/logo/:path*', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        ],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/(delete-request|contact/confirm)/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/subscribe/confirm',
        headers: [
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/newsletter/fonts/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/preferance/mail/unsub/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/preference/mail/unsub/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
    ];
  },
};

export default nextConfig;
