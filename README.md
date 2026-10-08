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
npm audit
```

## Security

See `/legal/security` for the disclosure policy. The app sets baseline browser security headers, validates same-origin contact submissions, limits JSON body size, escapes email content, and keeps secrets in server-only environment variables.

## License

Source code is covered by the repository `LICENSE`. Brand assets, personal media, and third-party materials are not automatically licensed by that file.
