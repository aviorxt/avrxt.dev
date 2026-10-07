-- Private lookup table for branded newsletter unsubscribe links.
-- The raw random key is only sent to the subscriber and Resend contact property;
-- only its SHA-256 hash is persisted here.
create table if not exists public.newsletter_unsubscribe_tokens (
  token_hash text primary key,
  email text not null,
  audience_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unsubscribed_at timestamptz
);

create index if not exists newsletter_unsubscribe_tokens_email_idx
  on public.newsletter_unsubscribe_tokens (email);

alter table public.newsletter_unsubscribe_tokens enable row level security;

-- No public policies. Server-side service-role operations only.
