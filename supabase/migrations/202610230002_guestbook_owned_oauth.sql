-- Move any early Guestbook table to AVRXT-owned OAuth identities.
-- Mutations are performed only by the server with the Supabase service role.
drop policy if exists "Guestbook entries are public" on public.guestbook_entries;
drop policy if exists "Authenticated visitors can sign the guestbook" on public.guestbook_entries;
drop policy if exists "Visitors can update their own guestbook entries" on public.guestbook_entries;
drop policy if exists "Visitors can remove their own guestbook entries" on public.guestbook_entries;
drop policy if exists "guestbook_public_read" on public.guestbook_entries;
drop policy if exists "guestbook_author_insert" on public.guestbook_entries;
drop policy if exists "guestbook_author_update" on public.guestbook_entries;
drop policy if exists "guestbook_author_delete" on public.guestbook_entries;

alter table public.guestbook_entries drop constraint if exists guestbook_entries_author_id_fkey;
alter table public.guestbook_entries alter column author_id type text using author_id::text;
alter table public.guestbook_entries drop constraint if exists guestbook_entries_author_id_check;
alter table public.guestbook_entries add constraint guestbook_entries_author_id_check check (author_id ~ '^(discord|github):[0-9]+$');
create policy "guestbook_public_read" on public.guestbook_entries for select using (true);
