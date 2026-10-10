# Newsletter broadcasts

The admin editor is available at `/me/admin/mail-broadcat`. It creates and manages Resend Broadcasts for the existing `RESEND_AUDIENCE_ID`; Resend handles broadcast queueing, scheduling, and suppression of unsubscribed contacts. The app editor supports HTML source, an isolated preview, test mail, drafts, immediate sends, and scheduled sends.

## Required setup

1. Apply `supabase/migrations/202610070001_newsletter_unsubscribe_tokens.sql` before deploying. The table stores only SHA-256 hashes of unsubscribe keys and has RLS enabled without public policies.
2. Configure the standalone Cloudflare Worker in `unsubscribe-worker/`. Set its three secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `RESEND_API_KEY`) with `npx wrangler secret put <NAME> --config unsubscribe-worker/wrangler.jsonc`, then deploy with `npx wrangler deploy --config unsubscribe-worker/wrangler.jsonc`. The Wrangler config attaches the Worker to the `unsub.avrxt.dev` custom domain; Cloudflare creates the DNS record and certificate. GET requests display the confirmation, and POST requests perform the opt-out. The raw unsubscribe token is never stored in the Worker or Supabase.
   - If `unsub.avrxt.dev` is currently attached to Vercel or has a DNS record pointing to Vercel, remove that custom-domain assignment and existing conflicting DNS record first. Then deploy the Worker custom domain. Do not point it at the main website's Vercel deployment.
3. Configure `NEWSLETTER_UNSUBSCRIBE_BASE_URL=https://unsub.avrxt.dev`.
4. Verify sender domains in Resend, then set `RESEND_FROM_DOMAINS` to a comma-separated allowlist (for example, `avrxt.dev,mail.avrxt.dev`). The editor permits custom From addresses only on these domains. Set `RESEND_DEFAULT_FROM` to the preferred display name and address.
5. Keep `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, and the Supabase service-role key set in the server environment. The Worker separately needs its own `RESEND_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` secrets. Do not expose any of these as `NEXT_PUBLIC_*` variables.

New subscribers receive a random unsubscribe key saved as a hash in Supabase and as a custom `UNSUBSCRIBE_URL` contact property in Resend. Before a broadcast is sent or scheduled, active audience contacts are provisioned with their own keys so older subscribers also receive a working branded link. The footer includes Resend's own unsubscribe placeholder as well, preserving Resend's native unsubscribe handling and list-unsubscribe headers.

Broadcast sends are intentionally explicit: save draft, send test, schedule, and send now are separate controls. The send controls show a confirmation prompt. Resend enforces that sender addresses belong to verified sending domains; the app's allowlist provides an additional check.
