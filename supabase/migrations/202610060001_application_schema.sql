-- Bootstrap before the existing spotify_status RLS migration. Existing tables
-- are retained; production operators should reconcile pre-existing columns.
begin;
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  title text not null, description text not null default '', content text not null default '',
  category text not null default 'General', color text not null default 'blue',
  published boolean not null default false, author text, tags text[] not null default '{}',
  date text, created_at timestamptz not null default now(), last_modified timestamptz not null default now()
);
create table if not exists public.me_config (
  key text primary key, data jsonb not null, updated_at timestamptz not null default now()
);
create table if not exists public.spotify_tokens (
  id uuid primary key default gen_random_uuid(), access_token text not null,
  refresh_token text not null, expires_at timestamptz not null
);
create table if not exists public.spotify_history (
  id uuid primary key default gen_random_uuid(), song_name text not null, artist text not null,
  cover_url text, played_at timestamptz not null default now(), unique(song_name, artist)
);
create table if not exists public.spotify_status (
  id integer primary key default 1 check (id = 1), is_playing boolean not null default false,
  title text, artist text, album text, album_image_url text, song_url text,
  progress_ms integer, duration_ms integer, updated_at timestamptz not null default now()
);
commit;
