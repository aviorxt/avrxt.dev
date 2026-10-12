begin;
alter table public.newsletter_unsubscribe_tokens enable row level security;
revoke all on public.newsletter_unsubscribe_tokens from public, anon, authenticated;
grant all on public.newsletter_unsubscribe_tokens to service_role;
-- Tokens are handled only by the application's server and unsubscribe Worker.
do $$ declare item record; begin
  for item in select policyname from pg_policies
    where schemaname='public' and tablename='newsletter_unsubscribe_tokens' loop
    execute format('drop policy %I on public.newsletter_unsubscribe_tokens', item.policyname);
  end loop;
end $$;
commit;
