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

Confirmation emails use `confirm@avrxt.dev`; welcome emails use `info@avrxt.dev`. Both require the existing `avrxt.dev` verified sending domain, with no new credentials. Templates are in `src/lib/newsletter-emails.ts`; static doodle PNGs and optional fonts are served from `/newsletter/`. Email clients that block web fonts use the supplied system fallbacks. Regenerate artwork with `node scripts/build-newsletter-assets.mjs`.

The confirmation page performs a read-only token check on GET and submits JSON to `/api/subscribe/confirm` after an explicit click. Tokens expire after 24 hours and are consumed through an atomic `confirmed_at IS NULL` update. Used links cannot activate a contact or send another welcome. The winning confirmation schedules welcome delivery with Next `after`, up to three bounded retries using one Resend idempotency key, and a working branded unsubscribe link. A welcome-provider outage does not roll back the subscription; inspect the sanitized `NEWSLETTER_WELCOME_UNAVAILABLE` event if delivery fails. The page suppresses analytics, removes the token from the visible URL, and prevents cross-site requests.

See `CLOUDFLARE_R2.md` for CORS, filename rewriting and upload verification. Smoke-test a new profile image and a media file from the deployed admin page after configuration. Existing assets are removed only after the edited profile is saved.

The development-only braces advisory currently has no published patched version. Production audit is clean. Keep repository lint patterns trusted; do not force npm's suggested Next.js downgrade. Track https://github.com/advisories/GHSA-vfj7-8cjw-p6xm for an upstream fix.

## Public site search

Algolia powers the navigation search dialog with typo tolerance, keyboard navigation, and a public-page fallback. Configure the three `NEXT_PUBLIC_ALGOLIA_*` values, an index-scoped server `ALGOLIA_WRITE_KEY` with `addObject`, `deleteObject`, `browse`, and `editSettings`, and a random `CRON_SECRET` of at least 32 characters. The browser key needs only `search`, the same index restriction, trusted website referers, max 10 hits per query, and a per-IP limit. Never use an Admin key in either environment.

Configure index ranking once in Algolia: searchable attributes `title`, `unordered(keywords)`, `description`, `content`, `href`; retrieved attributes `title`, `description`, `href`, `category`; no provider HTML highlighting. Routine synchronization does not rewrite index settings. Record tasks use bounded backoff for up to 25 seconds to accommodate asynchronous publication.

The protected `/api/search/sync` GET endpoint requires `Authorization: Bearer <CRON_SECRET>`. Vercel runs it daily at 04:00 UTC. It reads published notes through the anonymous/RLS database client, updates public page metadata and bounded note excerpts, and removes obsolete records. Admin document mutations request a background index update after saving. Failures preserve the database save and are repaired by daily reconciliation. Redis serializes index writers. Preview deployments read the Production public index and never rewrite it. A database outage stops reconciliation rather than clearing indexed content.

After the first Production deployment, invoke the protected sync endpoint once and verify a public note query. Keep the Free plan and its visible search attribution; quotas or provider outages fall back to local page navigation. Search requests disable query/click analytics and send no user identity; ordinary provider logs may still apply. Indexing limits require review before exceeding 5,000 published notes.

## Public status page

`/status` and `/api/status/details` read Better Stack’s public JSON feed for the existing AVRXT hosted status page. Both sources are fixed HTTPS URLs; no account API key is needed. The server whitelists public service, report and update fields, bounds response size and fetch duration, and shares a 30-second Redis cache. Source failure is displayed as unknown availability rather than healthy. The footer summary uses the same source. Public page links now lead to `/status`; `status.avrxt.dev` remains the independent fallback.

The browser updates status in place every minute and when returning to a visible tab. There is no reload or manual Refresh button. It preserves local history selection and expanded report timelines during normal updates. History gaps remain unmonitored, and manually reported entries have no measured uptime. Motion respects reduced-motion preferences.

The database monitor calls `/api/health/database` with a dedicated `STATUS_MONITOR_TOKEN`. Keep this random bearer token only in the Better Stack monitor and server environments. The route rejects missing/incorrect authentication before issuing a five-second anonymous/RLS query and returns only healthy/unavailable. It never returns records, database credentials, provider errors, or the broader deep-readiness report. The fresh service checks start on 12 October 2026; earlier legacy checks targeted unrelated or duplicated endpoints, so their history is not presented as AVRXT uptime.

Manage public incidents and scheduled maintenance in Better Stack’s existing status page. Only published status reports enter the web UI; internal incident alerts and notes do not. The current response limits are 50 public resources, 90 history days, 100 public reports, and 25 updates per report. Verify these before expanding the status page beyond those limits.

## License

Source code is covered by the repository `LICENSE`. Brand assets, personal media, and third-party materials are not automatically licensed by that file.
