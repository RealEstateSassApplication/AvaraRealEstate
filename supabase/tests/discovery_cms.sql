\set ON_ERROR_STOP on
-- Run against a disposable database after the migration.
begin;
set local role anon;
do $$ begin
  if (select count(*) from public.discovery_cms_published) <> 0 then raise exception 'Expected clean database'; end if;
  begin perform content from public.discovery_cms_draft; raise exception 'Anonymous draft read allowed'; exception when insufficient_privilege then null; end;
  begin perform content from public.discovery_cms_revisions; raise exception 'Anonymous history read allowed'; exception when insufficient_privilege then null; end;
  begin perform public.discovery_cms_mutate('save',0,'{"title":"unauthorized"}','anon'); raise exception 'Anonymous RPC allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin perform content from public.discovery_cms_draft; raise exception 'Authenticated draft read allowed'; exception when insufficient_privilege then null; end;
  begin perform public.discovery_cms_mutate('save',0,'{"title":"unauthorized"}','member'); raise exception 'Authenticated RPC allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
do $$ begin
  if public.discovery_cms_mutate('save',0,'{"title":"private draft"}','admin-test') <> 1 then raise exception 'Save revision incorrect'; end if;
  if (select count(*) from public.discovery_cms_published) <> 0 then raise exception 'Draft leaked into public table'; end if;
  begin perform public.discovery_cms_mutate('save',0,'{"title":"stale"}','admin-test'); raise exception 'Stale write allowed'; exception when unique_violation then null; end;
  if public.discovery_cms_mutate('publish',1,null,'admin-test') <> 2 then raise exception 'Publish revision incorrect'; end if;
  if public.discovery_cms_mutate('save',2,'{"title":"new private draft"}','admin-test') <> 3 then raise exception 'Second save incorrect'; end if;
  if (select count(*) from public.discovery_cms_revisions) <> 3 then raise exception 'Audit count incorrect'; end if;
  begin update public.discovery_cms_revisions set actor='tampered'; raise exception 'Direct audit mutation allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
  if (select content->>'title' from public.discovery_cms_published where key='site') is distinct from 'private draft' then raise exception 'Published snapshot incorrect'; end if;
  begin update public.discovery_cms_published set content='{}'; raise exception 'Anonymous update allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
