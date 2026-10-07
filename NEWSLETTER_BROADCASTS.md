# Newsletter broadcasts

The admin editor is available at `/me/admin/mail-broadcat`. It creates and manages Resend Broadcasts for the existing `RESEND_AUDIENCE_ID`; Resend handles broadcast queueing, scheduling, and suppression of unsubscribed contacts. The app editor supports HTML source, an isolated preview, test mail, drafts, immediate sends, and scheduled sends.

## Required setup

1. Apply `supabase/migrations/202610070001_newsletter_unsubscribe_tokens.sql` before deploying. The table stores only SHA-256 hashes of unsubscribe keys and has RLS enabled without public policies.
2. Point `unsub.avrxt.dev` at the same Next.js deployment and add it as a custom domain in the hosting project. The app serves unsubscribe confirmations at `https://unsub.avrxt.dev/mail/<random-key>` and the matching API endpoint on the same host. The confirmation page uses GET only to display the prompt; the user's POST confirms the opt-out.
3. Configure `NEWSLETTER_UNSUBSCRIBE_BASE_URL=https://unsub.avrxt.dev`.
4. Verify sender domains in Resend, then set `RESEND_FROM_DOMAINS` to a comma-separated allowlist (for example, `avrxt.dev,mail.avrxt.dev`). The editor permits custom From addresses only on these domains. Set `RESEND_DEFAULT_FROM` to the preferred display name and address.
5. Keep `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, and the Supabase service-role key set in the server environment. Do not expose them as `NEXT_PUBLIC_*` variables.

New subscribers receive a random unsubscribe key saved as a hash in Supabase and as a custom `UNSUBSCRIBE_URL` contact property in Resend. Before a broadcast is sent or scheduled, active audience contacts are provisioned with their own keys so older subscribers also receive a working branded link. The footer includes Resend's own unsubscribe placeholder as well, preserving Resend's native unsubscribe handling and list-unsubscribe headers.

Broadcast sends are intentionally explicit: save draft, send test, schedule, and send now are separate controls. The send controls show a confirmation prompt. Resend enforces that sender addresses belong to verified sending domains; the app's allowlist provides an additional check.
