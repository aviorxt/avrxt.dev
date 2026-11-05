# AVRXT API gateway

The `worker.ts` entrypoint composes the existing production gateway with the Last.fm music adapter and an explicit public-response cache policy. `gateway.mjs` preserves current production profile, Spotify, Discord WebSocket, status, weather and mail behaviour, including production changes absent from the old TypeScript file.

New GET routes: `/v1/music/chart`, `/v1/music/now-playing`, `/v1/music/artwork`, `/v1/music/artist-image`.

Muzix newsletter POST routes: `/v1/music/subscribe`, `/v1/music/confirm`, `/v1/music/unsubscribe`. These use a separate Resend segment and preserve the existing main-site `/v1/subscribe` contract. Set encrypted production secrets `MUZIX_RESEND_API_KEY` and `MUZIX_NEWSLETTER_SECRET`; `MUZIX_SEGMENT_ID` is in Wrangler vars. The shared rate limiter uses a separate newsletter key prefix. Signed email links require an explicit POST action; GET link scanners cannot join or leave the segment.

`newsletter.mjs` mirrors `avrxt-muzix/worker/newsletter.mjs` with a local template import. `newsletter-email.mjs` mirrors `avrxt-muzix/newsletter/email.mjs`; keep these synchronized. All email templates carry `with 🩶 @avrxt`. The monthly calendar snapshot is generated and delivered by the Muzix repository's GitHub Actions workflow, with encrypted Resend and Last.fm secrets, rather than a Worker cron.

Keep existing secrets and bindings. `LASTFM_API_KEY` is a production Worker secret; optional `LASTFM_USERNAME` defaults to `avrxt`. Never commit credentials. Last.fm write authentication is unnecessary.

History is cached internally for 20 seconds; charts and monthly summaries for 15 minutes; artwork and exact-name Deezer portraits for 24 hours. Music responses bypass outer Workers Cache. Artwork uses Last.fm metadata and verified Apple catalogue matches. The frontend can use Apple's public CORS endpoint when its shared datacentre connection is rate-limited. There is no audio streaming proxy.

Workers Cache uses the explicit allowlist in `cache-policy.mjs`. Only successful public root/status/weather/link-preview reads may be cached. Cookies, Authorization, Set-Cookie, private/no-store directives, health, playback, presence, profile config, writes, errors and unknown routes are uncached. Vary includes Origin, Cookie and Authorization. WebSockets remain live.

`npm run api:deploy` targets the existing Worker/domain. `npx wrangler deploy --dry-run --config api-worker/wrangler.jsonc` validates without deployment. Source cache/artwork/history tests live in the Muzix repo. When rolling back to old code without these safeguards, disable Workers Cache as well as restoring the previous Cloudflare version.

Extended monthly template support is mirrored in extended.mjs and enrich.mjs. The Worker bundles only the shared confirmation/welcome shell; the monthly artwork and playtime collection runs in GitHub Actions. Public logo images are hosted by Muzix for cross-origin email use.
