import { writeFile } from 'node:fs/promises';

// Amplify Hosting makes build variables available to the build container, while
// Next.js SSR needs an environment file included in its server artifact. Keep
// this list explicit: never copy the complete process environment into a file.
const names = [
  'ALGOLIA_WRITE_KEY', 'AUTH_CALLBACK_ORIGIN', 'AUTH_SESSION_SECRET',
  'AWS_ACCESS_KEY_ID', 'AWS_REGION', 'AWS_S3_BUCKET_NAME', 'AWS_S3_ENDPOINT', 'AWS_S3_FORCE_PATH_STYLE', 'AWS_SECRET_ACCESS_KEY',
  'CRON_SECRET', 'DISCORD_ADMIN_USER_ID', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET',
  'DISCORD_CONTACT_WEBHOOK_URL', 'DISCORD_DELETE_REQUEST_WEBHOOK_URL', 'DISCORD_GUILD_ID', 'DISCORD_ROLE_ID', 'DISCORD_TOKEN',
  'GATEWAY_SHARED_SECRET', 'HEALTH_CHECK_TOKEN', 'MAIL_AI_API_URL', 'MAIL_AI_SHARED_SECRET',
  'MUX_TOKEN_ID', 'MUX_TOKEN_SECRET', 'NEXT_PUBLIC_ALGOLIA_APP_ID', 'NEXT_PUBLIC_ALGOLIA_INDEX_NAME',
  'NEXT_PUBLIC_ALGOLIA_SEARCH_KEY', 'NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_EDGE_BASE_URL', 'NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION',
  'NEXT_PUBLIC_OG_VERSION', 'NEXT_PUBLIC_R2_DOMAIN', 'NEXT_PUBLIC_R2_IMAGE_DOMAIN', 'NEXT_PUBLIC_R2_VIDEO_DOMAIN',
  'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_URL',
  'R2_ACCESS_KEY_ID', 'R2_BUCKET_NAME', 'R2_ENDPOINT', 'R2_SECRET_ACCESS_KEY', 'R2_UPLOAD_ORIGINS',
  'REDIS_CACHE_NAMESPACE', 'REDIS_REST_TOKEN', 'REDIS_REST_URL', 'RESEND_API_KEY', 'RESEND_AUDIENCE_ID',
  'RESEND_DEFAULT_FROM', 'RESEND_FROM_DOMAINS', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET',
  'STATUS_MONITOR_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY', 'TRUST_CLOUDFLARE_PROXY', 'YOUTUBE_API_KEY',
];

const escape = (value) => JSON.stringify(value);
const rows = names
  .filter((name) => typeof process.env[name] === 'string' && process.env[name].trim())
  .map((name) => `${name}=${escape(process.env[name])}`);

await writeFile('.env.production', `${rows.join('\n')}\n`, { mode: 0o600 });
console.log(`Amplify runtime environment prepared (${rows.length} configured variables).`);
