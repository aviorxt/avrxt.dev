begin;
create table if not exists public.newsletter_confirmations (
  token_hash text primary key, email text not null, audience_id text not null,
  expires_at timestamptz not null, confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.newsletter_confirmations enable row level security;
revoke all on public.newsletter_confirmations from public, anon, authenticated;
grant all on public.newsletter_confirmations to service_role;
create index if not exists newsletter_confirmations_expiry_idx on public.newsletter_confirmations(expires_at);
commit;
