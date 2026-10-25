# AVRXT.DEV Deployment Report

> Snapshot generated: 26 October 2026 (Asia/Kolkata)  
> Repository: [`aviorxt/avrxt.dev`](https://github.com/aviorxt/avrxt.dev)  
> Scope: this repository only. `me.avrxt.dev` and `muzix.avrxt.dev` are intentionally excluded because they are separate AWS Amplify repositories.

## Executive summary

GitHub currently records **575 deployments** for this repository. The GitHub deployment feed shows two Vercel environments:

| Environment | Provider | Purpose | Current observed state |
| --- | --- | --- | --- |
| Production | Vercel | Public `www.avrxt.dev` application and admin dashboard | Active |
| Preview | Vercel | Branch / pull-request previews | Active |

The newest observed production deployment is commit [`6b39fac`](https://github.com/aviorxt/avrxt.dev/commit/6b39facbd99fb1a220f01b25b2076ac9f1979e73), deployed successfully on **26 October 2026 at 05:05 IST**.

The current branch contains a newer preview deployment for commit [`291b613`](https://github.com/aviorxt/avrxt.dev/commit/291b613f2d0613ef5e931d355673d29cfa1bad60), deployed successfully on **26 October 2026 at 05:15 IST**. It is not a production deployment until its changes are merged to `main` and Vercel promotes the resulting commit.

## Deployment ownership and boundaries

### In scope: this repository

| Surface | Hosting / delivery | Repository evidence | Notes |
| --- | --- | --- | --- |
| `www.avrxt.dev` | Vercel | GitHub Production environment; `vercel.json` | Main landing experience and admin dashboard. |
| Vercel previews | Vercel | GitHub Preview environment | Automatically produced for branch / pull-request commits. |
| `api.avrxt.dev` | Cloudflare Worker | `api-worker/wrangler.jsonc` | Worker name: `avrxt-api-gateway`; custom domain route configured. |
| `unsub.avrxt.dev` | Cloudflare Worker | `unsubscribe-worker/wrangler.jsonc` | Worker name: `avrxt-newsletter-unsubscribe`; custom domain route configured. |
| Legacy/auxiliary edge worker | Cloudflare Worker | `cloudflare/edge-api/wrangler.jsonc` | Worker name: `avrxt-edge-api`; has `workers_dev: true` and no custom-domain route in this config. |
| Search sync | Vercel Cron | `vercel.json` | Calls `/api/search/sync` daily at `04:00` UTC. |

### Explicitly out of scope

| Surface | Hosting | Why excluded |
| --- | --- | --- |
| `me.avrxt.dev` | AWS Amplify | Separate repository: `aviorxt/avrxt-me`. |
| `muzix.avrxt.dev` | AWS Amplify | Separate repository: `aviorxt/avrxt-muzix`. |

## Active deployment records

### Production

| Field | Value |
| --- | --- |
| Status | Deployed / active |
| Commit | [`6b39fac`](https://github.com/aviorxt/avrxt.dev/commit/6b39facbd99fb1a220f01b25b2076ac9f1979e73) |
| Commit subject | `Merge pull request #11 from aviorxt/feat/standalone-muzix` |
| Deployed at | 26 October 2026, 05:05 IST |
| Provider | Vercel GitHub App |
| Immutable deployment URL | <https://avrxt-eg8034hbp-aviors-core.vercel.app/> |
| GitHub environment | [Production](https://github.com/aviorxt/avrxt.dev/deployments/Production) |

### Latest preview

| Field | Value |
| --- | --- |
| Status | Deployed / active |
| Commit | [`291b613`](https://github.com/aviorxt/avrxt.dev/commit/291b613f2d0613ef5e931d355673d29cfa1bad60) |
| Commit subject | `ci: enrich release narratives and AI diagnostics` |
| Deployed at | 26 October 2026, 05:15 IST |
| Provider | Vercel GitHub App |
| Immutable deployment URL | <https://avrxt-mupwzhxli-aviors-core.vercel.app/> |
| GitHub environment | [Preview](https://github.com/aviorxt/avrxt.dev/deployments/Preview) |

## Recent GitHub/Vercel deployment history

This is the most recent visible portion of the 575-record GitHub deployment ledger at report time. All rows are Vercel GitHub App deployments.

| Date/time (IST) | Environment | Status | Commit | Change | Deployment |
| --- | --- | --- | --- | --- | --- |
| 26 Oct, 05:15 | Preview | Deployed | [`291b613`](https://github.com/aviorxt/avrxt.dev/commit/291b613f2d0613ef5e931d355673d29cfa1bad60) | `ci: enrich release narratives and AI diagnostics` | [Open](https://avrxt-mupwzhxli-aviors-core.vercel.app/) |
| 26 Oct, 05:05 | Production | Deployed | [`6b39fac`](https://github.com/aviorxt/avrxt.dev/commit/6b39facbd99fb1a220f01b25b2076ac9f1979e73) | Merge PR #11 from `feat/standalone-muzix` | [Open](https://avrxt-eg8034hbp-aviors-core.vercel.app/) |
| 26 Oct, 05:02 | Preview | Deployed | [`f06d30c`](https://github.com/aviorxt/avrxt.dev/commit/f06d30cacca15508b4f67359cf7648bcd86acaea) | `ci: add Gemini release copy fallback` | [Open](https://avrxt-7pfech191-aviors-core.vercel.app/) |
| 26 Oct, 04:57 | Preview | Deployed | [`593bf1a`](https://github.com/aviorxt/avrxt.dev/commit/593bf1a7a5fe62ec216ffb647f9da81b67605bf1) | `ci: draft release copy with OpenAI` | [Open](https://avrxt-hstzhhmjg-aviors-core.vercel.app/) |
| 26 Oct, 04:53 | Preview | Deployed | [`ef59193`](https://github.com/aviorxt/avrxt.dev/commit/ef591939613fb0a8013b94415b1a0bc95d376270) | `ci: enrich verified Discord release logs` | [Open](https://avrxt-8nrcck6do-aviors-core.vercel.app/) |
| 26 Oct, 04:46 | Production | Deployed | [`3056975`](https://github.com/aviorxt/avrxt.dev/commit/30569757cca217ecda68beb06d42820c977742c5) | Merge PR #10 from `feat/standalone-muzix` | [Open](https://avrxt-qtx220mhq-aviors-core.vercel.app/) |
| 26 Oct, 04:38 | Preview | Deployed | [`761b964`](https://github.com/aviorxt/avrxt.dev/commit/761b96459d3707dfc2a19d48be674f9cec76a190) | `ci: publish releases and Discord notes from main` | [Open](https://avrxt-dvdnya9fb-aviors-core.vercel.app/) |
| 26 Oct, 04:17 | Preview | Deployed | [`ced22f2`](https://github.com/aviorxt/avrxt.dev/commit/ced22f2bf84f84cfc2bcefec19e9bc3d64f0cdd7) | `fix: restore standalone profile CI coverage` | [Open](https://avrxt-nviq376pd-aviors-core.vercel.app/) |
| 25 Oct, 20:34 | Preview | Deployed | [`d128932`](https://github.com/aviorxt/avrxt.dev/commit/d12893271600bce8ac8b50426a8d1a745e7aa1ec) | `fix: exclude edge worker from Next typecheck` | [Open](https://avrxt-e0yskvjao-aviors-core.vercel.app/) |
| 25 Oct, 20:29 | Preview | **Failed** | [`0d0f84c`](https://github.com/aviorxt/avrxt.dev/commit/0d0f84cdf151da115a6125e7e426d1aafb502e2e) | `feat: proxy profile realtime through API gateway` | [Deployment record](https://avrxt-fwkd3mhvs-aviors-core.vercel.app/) |
| 24 Oct, 23:15 | Preview | Deployed | [`6eabc3`](https://github.com/aviorxt/avrxt.dev/commit/6eabc3de74ade587eb179cd2fa0c9e549f290e2c) | `feat: expose live Spotify playback gateway` | [Open](https://avrxt-md87ryejk-aviors-core.vercel.app/) |
| 24 Oct, 14:24 | Preview | Deployed | [`56d5914`](https://github.com/aviorxt/avrxt.dev/commit/56d591493df40ec65da0a3b67c7f0a814800d102) | `fix: keep landing newsletter in document flow` | [Open](https://avrxt-8v7sx5iu6-aviors-core.vercel.app/) |
| 24 Oct, 14:18 | Preview | Deployed | [`ec2bc26`](https://github.com/aviorxt/avrxt.dev/commit/ec2bc26fc1723543138d0767922ca1d8fe3caa90) | `fix: keep landing newsletter dock viewport-fixed` | [Open](https://avrxt-pzdlnxufa-aviors-core.vercel.app/) |
| 24 Oct, 14:15 | Preview | Deployed | [`9c0bfa3`](https://github.com/aviorxt/avrxt.dev/commit/9c0bfa30073850ec4f9b52d02e45ebbfd4c62569) | `fix: avoid newsletter content-blocker selectors` | [Open](https://avrxt-rj6zdm54m-aviors-core.vercel.app/) |
| 24 Oct, 14:12 | Preview | Deployed | [`9f73389`](https://github.com/aviorxt/avrxt.dev/commit/9f733899953de4d444ef6c3beb24620cc9df88b2) | `fix: dock newsletter on compact desktop views` | [Open](https://avrxt-6cefkqfz5-aviors-core.vercel.app/) |
| 24 Oct, 14:08 | Preview | Deployed | [`3dfaa24`](https://github.com/aviorxt/avrxt.dev/commit/3dfaa24414e38b7478f1c8a3eb8503a379f277b8) | `fix: anchor landing newsletter across viewports` | [Open](https://avrxt-b47j58asz-aviors-core.vercel.app/) |
| 24 Oct, 13:59 | Preview | Deployed | [`e044f6c`](https://github.com/aviorxt/avrxt.dev/commit/e044f6ceb5d8b111905f112b3416ccb6c3a711dd) | `fix: keep landing newsletter visible` | [Open](https://avrxt-g55hiyg3w-aviors-core.vercel.app/) |
| 24 Oct, 13:38 | Preview | Deployed | [`673c286`](https://github.com/aviorxt/avrxt.dev/commit/673c2867fc086d6651cff1f9642f56d725d03613) | `docs: update privacy terms and security notices` | [GitHub deployments](https://github.com/aviorxt/avrxt.dev/deployments) |
| 24 Oct, 13:28 | Preview | Deployed | [`f28b252`](https://github.com/aviorxt/avrxt.dev/commit/f28b252844b6a101dae5d6de6ba450c7e7fc8bf7) | `fix: restore Muzix chart data service` | [GitHub deployments](https://github.com/aviorxt/avrxt.dev/deployments) |
| 24 Oct, 13:20 | Production | Deployed | [`d842a7b`](https://github.com/aviorxt/avrxt.dev/commit/d842a7b146ebbd403cf687e1ca923d349d5ff953) | `refactor: remove legacy Muzix chart backend` | [GitHub deployments](https://github.com/aviorxt/avrxt.dev/deployments/Production) |
| 24 Oct, 13:19 | Preview | Deployed | [`d842a7b`](https://github.com/aviorxt/avrxt.dev/commit/d842a7b146ebbd403cf687e1ca923d349d5ff953) | `refactor: remove legacy Muzix chart backend` | [GitHub deployments](https://github.com/aviorxt/avrxt.dev/deployments/Preview) |
| 24 Oct, 12:57 | Preview | Deployed | [`8436487`](https://github.com/aviorxt/avrxt.dev/commit/8436487ca2af88eb2b2b450c0b69efa4983e0f23) | `refactor: move Muzix chart to standalone app` | [GitHub deployments](https://github.com/aviorxt/avrxt.dev/deployments/Preview) |
| 24 Oct, 12:46 | Production | Deployed | [`d33de58`](https://github.com/aviorxt/avrxt.dev/commit/d33de585f988abedb1d873073e753d454aced689) | `fix: route public profile to standalone app` | [GitHub deployments](https://github.com/aviorxt/avrxt.dev/deployments/Production) |
| 24 Oct, 12:44 | Preview | Deployed | [`d33de58`](https://github.com/aviorxt/avrxt.dev/commit/d33de585f988abedb1d873073e753d454aced689) | `fix: route public profile to standalone app` | [GitHub deployments](https://github.com/aviorxt/avrxt.dev/deployments/Preview) |
| 24 Oct, 11:43 | Preview | Deployed | [`120f5bc`](https://github.com/aviorxt/avrxt.dev/commit/120f5bc9492adb74150dc65bdb93f3296bf08f9b) | `feat: publish live Spotify state to realtime clients` | [GitHub deployments](https://github.com/aviorxt/avrxt.dev/deployments/Preview) |

> For the complete, paginated 575-record ledger, use [GitHub Deployments](https://github.com/aviorxt/avrxt.dev/deployments). GitHub is the authoritative source for per-record timestamps and provider status.

## Deployment automation

### Vercel

The GitHub deployment feed identifies **Vercel** as the deployment actor for both Preview and Production. The repository has no custom Vercel build script in `vercel.json`; Vercel uses the Next.js project configuration and the standard package scripts.

`vercel.json` configures one scheduled production task:

| Cron path | Schedule | Meaning |
| --- | --- | --- |
| `/api/search/sync` | `0 4 * * *` | Runs every day at 04:00 UTC (09:30 IST). |

### GitHub Actions verification and release automation

| Workflow | Trigger | What it does | Deployment effect |
| --- | --- | --- | --- |
| `Verify` (`.github/workflows/ci.yml`) | Push and pull request | `npm ci`, tests, lint, Next build, production dependency audit, and Worker deployment dry-runs | Does **not** deploy. It blocks/validates changes only. |
| `Publish release notes` (`.github/workflows/release-notes.yml`) | A successful `Verify` run for a push to `main` | Builds release notes, creates a GitHub Release, and posts a Discord release embed | Does **not** deploy application code. |

The release workflow is designed to announce only commits whose verification workflow passed. It uses the repository `GITHUB_TOKEN` for GitHub release creation and optional configured secrets for the Discord webhook and AI-assisted editorial copy.

### Cloudflare Workers

| Worker configuration | Worker name | Intended route | CI handling |
| --- | --- | --- | --- |
| `api-worker/wrangler.jsonc` | `avrxt-api-gateway` | `api.avrxt.dev` | `wrangler deploy --dry-run` only |
| `unsubscribe-worker/wrangler.jsonc` | `avrxt-newsletter-unsubscribe` | `unsub.avrxt.dev` | `wrangler deploy --dry-run` only |
| `cloudflare/edge-api/wrangler.jsonc` | `avrxt-edge-api` | No custom route declared | `wrangler deploy --dry-run` only |

**Important:** this repository verifies Cloudflare Worker deployability in CI, but no workflow performs a live `wrangler deploy`. Live Worker releases must therefore occur via a manual command, another repository/workflow, or a provider-side integration not represented in this codebase.

## Failure and rollback observations

- The latest visible failed Vercel deployment is preview commit [`0d0f84c`](https://github.com/aviorxt/avrxt.dev/commit/0d0f84cdf151da115a6125e7e426d1aafb502e2e), `feat: proxy profile realtime through API gateway`, at 25 October 2026, 20:29 IST.
- The next observed preview, [`d128932`](https://github.com/aviorxt/avrxt.dev/commit/d12893271600bce8ac8b50426a8d1a745e7aa1ec), deployed successfully after excluding the edge worker from the Next type check.
- Production is not currently on the failed preview revision. It is active on [`6b39fac`](https://github.com/aviorxt/avrxt.dev/commit/6b39facbd99fb1a220f01b25b2076ac9f1979e73).
- Vercel keeps immutable deployment URLs, which provide a practical rollback target when the previous production deployment is known-good. Promotion itself must be performed in Vercel; it is not automated by this repository’s GitHub Actions workflows.

## Operational recommendations

1. Keep `main` protected and require the `Verify` workflow before merges. This preserves the current release-note guarantee.
2. Add a separate Cloudflare deployment workflow only if automatic Worker releases are desired. Keep it distinct from Vercel production deployment and restrict its API token to the required Workers routes.
3. Retain the GitHub deployment feed as the canonical deployment ledger. It already records Vercel environment, commit, status, provider, and immutable preview URL.
4. Record rollback decisions in a GitHub Release or incident note with both the prior production commit and the Vercel deployment URL.
5. Avoid putting provider credentials or webhook values in this report or repository files; use GitHub Actions secrets and provider secret stores.

## Source evidence

- [GitHub deployment ledger](https://github.com/aviorxt/avrxt.dev/deployments)
- [Production environment history](https://github.com/aviorxt/avrxt.dev/deployments/Production)
- [Preview environment history](https://github.com/aviorxt/avrxt.dev/deployments/Preview)
- Local repository configurations: `vercel.json`, `.github/workflows/ci.yml`, `.github/workflows/release-notes.yml`, `api-worker/wrangler.jsonc`, `unsubscribe-worker/wrangler.jsonc`, and `cloudflare/edge-api/wrangler.jsonc`.
