-- Additive editorial CMS; no legacy listing, tenant or financial data is migrated.
begin;
create table public.discovery_cms_draft (
  key text primary key check (key = 'site'),
  revision integer not null check (revision > 0),
  content jsonb not null check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 65536),
  updated_at timestamptz not null default now()
);
create table public.discovery_cms_published (
  key text primary key check (key = 'site'),
  revision integer not null check (revision > 0),
  content jsonb not null check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 65536),
  published_at timestamptz not null default now()
);
create table public.discovery_cms_revisions (
  key text not null check (key = 'site'),
  revision integer not null check (revision > 0),
  action text not null check (action in ('save','publish')),
  content jsonb not null check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 65536),
  actor text not null check (length(actor) between 1 and 128),
  created_at timestamptz not null default now(),
  primary key(key, revision)
);
alter table public.discovery_cms_draft enable row level security;
alter table public.discovery_cms_published enable row level security;
alter table public.discovery_cms_revisions enable row level security;
revoke all on public.discovery_cms_draft, public.discovery_cms_published, public.discovery_cms_revisions from public, anon, authenticated, service_role;
grant select on public.discovery_cms_published to anon, authenticated, service_role;
grant select on public.discovery_cms_draft, public.discovery_cms_revisions to service_role;
create policy discovery_public_snapshot on public.discovery_cms_published for select to anon, authenticated using (key = 'site');

-- Service-role execution only. Legacy admin identity is checked in Next.js.
-- One transaction updates draft, public snapshot (publish only) and audit history.
create function public.discovery_cms_mutate(p_action text, p_expected integer, p_content jsonb, p_actor text)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_revision integer;
  v_content jsonb;
  v_next integer;
begin
  if p_action is null or p_action not in ('save','publish') or p_expected is null or p_expected < 0 or p_expected >= 2147483647 or p_actor is null or length(p_actor) not between 1 and 128 then
    raise exception 'Invalid CMS mutation' using errcode = '22023';
  end if;
  -- Serializes even the first write, when there is no row to lock.
  perform pg_catalog.pg_advisory_xact_lock(19807001);
  select revision, content into v_revision, v_content from public.discovery_cms_draft where key = 'site' for update;
  if coalesce(v_revision, 0) <> p_expected then
    raise exception 'Revision conflict' using errcode = '23505';
  end if;
  if p_action = 'save' then
    if p_content is null or jsonb_typeof(p_content) <> 'object' or octet_length(p_content::text) > 65536 then
      raise exception 'Invalid draft' using errcode = '22023';
    end if;
    v_content := p_content;
  elsif v_revision is null or p_content is not null then
    raise exception 'Save a draft before publishing' using errcode = '22023';
  end if;
  v_next := coalesce(v_revision, 0) + 1;
  insert into public.discovery_cms_draft(key, revision, content) values ('site', v_next, v_content)
    on conflict (key) do update set revision = excluded.revision, content = excluded.content, updated_at = now();
  if p_action = 'publish' then
    insert into public.discovery_cms_published(key, revision, content) values ('site', v_next, v_content)
      on conflict (key) do update set revision = excluded.revision, content = excluded.content, published_at = now();
  end if;
  insert into public.discovery_cms_revisions(key, revision, action, content, actor)
    values ('site', v_next, p_action, v_content, p_actor);
  return v_next;
end;
$$;
revoke all on function public.discovery_cms_mutate(text, integer, jsonb, text) from public, anon, authenticated, service_role;
grant execute on function public.discovery_cms_mutate(text, integer, jsonb, text) to service_role;
commit;
