begin;
create table if not exists public.verified_requests (
 id uuid primary key, kind text not null check(kind in ('contact','deletion')),
 email text not null, payload jsonb not null, token_hash text not null unique,
 created_at timestamptz not null default now(), expires_at timestamptz not null,
 confirmed_at timestamptz, processing_until timestamptz, notified_at timestamptz,
 discord_message_id text, receipt_sent_at timestamptz
);
alter table public.verified_requests enable row level security;
revoke all on public.verified_requests from public, anon, authenticated;
grant all on public.verified_requests to service_role;
create index if not exists verified_requests_expiry_idx on public.verified_requests(expires_at) where confirmed_at is null;
comment on table public.verified_requests is 'Private intake. Inbox verification does not authorize automatic deletion; manual ownership review required.';
commit;
