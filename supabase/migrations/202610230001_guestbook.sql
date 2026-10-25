-- Public Guestbook using AVRXT-owned Discord/GitHub OAuth sessions.
create table if not exists public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  author_id text not null check (author_id ~ '^(discord|github):[0-9]+$'),
  provider text not null check (provider in ('discord', 'github')),
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  message text not null check (char_length(message) between 1 and 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guestbook_entries_created_at_idx on public.guestbook_entries (created_at desc);
create index if not exists guestbook_entries_author_id_idx on public.guestbook_entries (author_id);

alter table public.guestbook_entries enable row level security;

drop policy if exists "Guestbook entries are public" on public.guestbook_entries;
drop policy if exists "guestbook_public_read" on public.guestbook_entries;
create policy "guestbook_public_read" on public.guestbook_entries for select using (true);
