begin;

-- Payment receipts contain personal and payment identifiers. Public tip
-- submissions go through the server action after Razorpay verification; the
-- public site reads a deliberately limited projection via that server action.
alter table public.cupcake_tips enable row level security;
revoke all on table public.cupcake_tips from public, anon, authenticated;

-- The current track is intentionally shared with visitors and published to
-- Supabase Realtime. Keep it read-only for client roles; the edge function uses
-- the service role to refresh the row.
alter table public.spotify_status enable row level security;
revoke insert, update, delete, truncate, references, trigger
  on table public.spotify_status from public, anon, authenticated;
grant select on table public.spotify_status to anon, authenticated;

drop policy if exists "spotify_status_public_read" on public.spotify_status;
create policy "spotify_status_public_read"
  on public.spotify_status
  for select
  to anon, authenticated
  using (true);

commit;
