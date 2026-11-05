# AVRXT API gateway

The `worker.ts` entrypoint composes the existing production gateway with the Last.fm music adapter and an explicit public-response cache policy. `gateway.mjs` preserves current production profile, Spotify, Discord WebSocket, status, weather and mail behaviour, including production changes absent from the old TypeScript file.

New GET routes: `/v1/music/chart`, `/v1/music/now-playing`, `/v1/music/artwork`, `/v1/music/artist-image`.

Keep existing secrets and bindings. `LASTFM_API_KEY` is a production Worker secret; optional `LASTFM_USERNAME` defaults to `avrxt`. Never commit credentials. Last.fm write authentication is unnecessary.

History is cached internally for 20 seconds; charts and monthly summaries for 15 minutes; artwork and exact-name Deezer portraits for 24 hours. Music responses bypass outer Workers Cache. Artwork uses Last.fm metadata and verified Apple catalogue matches. The frontend can use Apple's public CORS endpoint when its shared datacentre connection is rate-limited. There is no audio streaming proxy.

Workers Cache uses the explicit allowlist in `cache-policy.mjs`. Only successful public root/status/weather/link-preview reads may be cached. Cookies, Authorization, Set-Cookie, private/no-store directives, health, playback, presence, profile config, writes, errors and unknown routes are uncached. Vary includes Origin, Cookie and Authorization. WebSockets remain live.

`npm run api:deploy` targets the existing Worker/domain. `npx wrangler deploy --dry-run --config api-worker/wrangler.jsonc` validates without deployment. Source cache/artwork/history tests live in the Muzix repo. When rolling back to old code without these safeguards, disable Workers Cache as well as restoring the previous Cloudflare version.
