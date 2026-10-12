# avrxt.dev

The source for [avrxt.dev](https://avrxt.dev): a monochrome Next.js portfolio, publishing surface, profile, newsletter, contact channel, and focused web-tool collection.

## Stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS 4
- Supabase for application data
- Cloudflare Workers/R2 for edge services and media
- Resend and Gmail for requested communications
- Framer Motion and small CSS motion primitives

## Public tools

- `/tools/whatismyip` — request/network details
- `/tools/portcheck` — guarded single-port TCP reachability checks for authorized public hosts
- `/tools/mailfy` — email syntax and MX diagnostics
- `/tools/dns` — Cloudflare DNS-over-HTTPS and RDAP registration summaries
- `/tools/fontui` — on-demand previews from the open-source Google Fonts catalog
- `/tools/spotmp3` — official Spotify embeds only; no downloading or media conversion
- `/tools/quote` — random quotes via DummyJSON

Network-facing tools validate inputs, block private/reserved destinations, limit request size, and apply rate limits. Tool results are informational and must not be treated as proof of ownership, availability, or security.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and provide only the integrations you intend to use. Never commit real credentials.

## Verification

```bash
npm run lint
npm run build
npm test
npm audit
```

## Security

See `/legal/security` for the disclosure policy. The app sets baseline browser security headers, validates same-origin contact submissions, limits JSON body size, escapes email content, and keeps secrets in server-only environment variables.

## Redis REST cache

Public profile, published documents, maintenance, Spotify, status and link previews use a shared Redis REST cache when configured. Admin writes invalidate affected entries; public loaders never inherit session cookies. Redis also handles fixed-window rate limits, with the database limiter retained as fallback. Configure server-only `REDIS_REST_URL`, `REDIS_REST_TOKEN`, and a deployment-specific `REDIS_CACHE_NAMESPACE`; run `npm run redis:check`. See `REDIS_CACHE.md` for TTLs, outage behavior, credentials and verification.

## Deploying the security and upload fixes

Apply all `supabase/migrations` in filename order before deploying the app. For an existing database, reconcile the bootstrap definitions with its actual schema and apply the new access/rate-limit and confirmation migrations. The access migration replaces old public policies on application tables; public documents remain readable only when published, and Spotify tokens/history remain private. Database rate limits fail closed in production if the migration or service-role configuration is missing.

Configure the same `GATEWAY_SHARED_SECRET` in the web deployment and API Worker so the origin can verify the visitor IP forwarded by Cloudflare. Existing `MAIL_AI_SHARED_SECRET` can serve as the fallback signing secret when the dedicated value is unset on both sides. Unsigned visitor headers are ignored; otherwise gateway traffic would share the proxy's IP quota. `TRUST_CLOUDFLARE_PROXY` is for a directly protected Cloudflare origin, not a publicly reachable Vercel origin.

Deploy the auth Worker together with the web app. Login now uses a state/PKCE transaction and 15-minute access tokens. Web admin checks require `DISCORD_TOKEN`, `DISCORD_GUILD_ID`, and `DISCORD_ROLE_ID`, or the configured `DISCORD_ADMIN_USER_ID` owner exception. Owner configuration must match the issuer. Never set these as public variables.

Newsletter signup sends a confirmation link; it does not activate or reactivate a contact until the recipient confirms with POST. Configure the canonical HTTPS site origin and verified Resend sender. `/api/health` is cheap liveness; protected readiness is `/api/health?deep=1` with `Authorization: Bearer <HEALTH_CHECK_TOKEN>`.

See `CLOUDFLARE_R2.md` for CORS, filename rewriting and upload verification. Smoke-test a new profile image and a media file from the deployed admin page after configuration. Existing assets are removed only after the edited profile is saved.

The development-only braces advisory currently has no published patched version. Production audit is clean. Keep repository lint patterns trusted; do not force npm's suggested Next.js downgrade. Track https://github.com/advisories/GHSA-vfj7-8cjw-p6xm for an upstream fix.

## License

Source code is covered by the repository `LICENSE`. Brand assets, personal media, and third-party materials are not automatically licensed by that file.
