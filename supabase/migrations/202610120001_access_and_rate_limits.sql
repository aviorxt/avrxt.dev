begin;
-- Replace legacy policies, including permissive policies that would otherwise
-- combine with the publication-only policy using OR.
do $$ declare policy_row record; table_name text; begin
  foreach table_name in array array['documents','me_config','spotify_tokens','spotify_history'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    for policy_row in select policyname from pg_policies where schemaname='public' and tablename=table_name loop
      execute format('drop policy %I on public.%I', policy_row.policyname, table_name);
    end loop;
  end loop;
end $$;
grant select on public.documents, public.me_config to anon, authenticated;
grant all on public.documents, public.me_config, public.spotify_tokens, public.spotify_history to service_role;
create policy documents_published_read on public.documents for select to anon, authenticated using (published = true);
create policy me_config_public_read on public.me_config for select to anon, authenticated using (key = 'main_config');
create table if not exists public.api_rate_limits (
  key text primary key, count integer not null, expires_at timestamptz not null
);
alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;
grant all on public.api_rate_limits to service_role;
create or replace function public.consume_rate_limit(bucket_key text, max_requests integer, window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare request_count integer;
begin
  if max_requests < 1 or window_seconds < 1 or length(bucket_key) <> 64 then return false; end if;
  delete from public.api_rate_limits where key in
    (select key from public.api_rate_limits where expires_at < now() limit 100);
  insert into public.api_rate_limits as limits(key,count,expires_at)
    values(bucket_key,1,now()+make_interval(secs => window_seconds))
  on conflict(key) do update set
    count=case when limits.expires_at <= now() then 1 else limits.count+1 end,
    expires_at=case when limits.expires_at <= now() then now()+make_interval(secs => window_seconds) else limits.expires_at end
  returning count into request_count;
  return request_count <= max_requests;
end $$;
revoke all on function public.consume_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
create index if not exists api_rate_limits_expiry_idx on public.api_rate_limits(expires_at);
commit;
