\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002'),('00000000-0000-4000-8000-000000000003');
insert into public.avara_profiles(id,display_name,role) values ('00000000-0000-4000-8000-000000000001','Manager','manager'),('00000000-0000-4000-8000-000000000002','Customer','customer'),('00000000-0000-4000-8000-000000000003','Other','customer');
insert into public.avara_properties(id,owner_id,title,description,property_type,purpose,status,price,currency,rent_period,city,district) values ('aaaaaaaaaaaaaaaaaaaaaaaa','00000000-0000-4000-8000-000000000001','Room','Fixture','room','rent','active',25000,'LKR','monthly','Nugegoda','Colombo'),('bbbbbbbbbbbbbbbbbbbbbbbb','00000000-0000-4000-8000-000000000001','Draft','Fixture','room','rent','pending',25000,'LKR','monthly','Nugegoda','Colombo');
insert into public.avara_property_private values('aaaaaaaaaaaaaaaaaaaaaaaa','Private street','Internal notes');
insert into public.avara_conversations(id,property_id,seeker_id,owner_id) values('00000000-0000-4000-8000-000000000010','aaaaaaaaaaaaaaaaaaaaaaaa','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001');
insert into public.avara_messages(conversation_id,sender_id,body) values('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000002','Private message');
set local role anon;
do $$ begin
 if (select count(id) from public.avara_properties)<>1 then raise exception 'public active filtering failed'; end if;
 begin perform owner_id from public.avara_properties; raise exception 'owner exposed'; exception when insufficient_privilege then null; end;
 begin perform street_address from public.avara_property_private; raise exception 'private street exposed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$ begin
 if (select count(*) from public.avara_profiles)<>1 then raise exception 'profile isolation failed'; end if;
 if (select count(*) from public.avara_messages)<>1 then raise exception 'participant cannot read message'; end if;
 begin update public.avara_profiles set role='admin'; raise exception 'self privilege escalation'; exception when insufficient_privilege then null; end;
 begin update public.avara_properties set status='active'; raise exception 'unauthorized publication'; exception when insufficient_privilege then null; end;
 insert into public.avara_favorites(user_id,property_id) values('00000000-0000-4000-8000-000000000002','aaaaaaaaaaaaaaaaaaaaaaaa');
 begin insert into public.avara_favorites(user_id,property_id) values('00000000-0000-4000-8000-000000000002','bbbbbbbbbbbbbbbbbbbbbbbb'); raise exception 'draft favorite permitted'; exception when insufficient_privilege then null; end;
 begin insert into public.avara_favorites(user_id,property_id) values('00000000-0000-4000-8000-000000000003','aaaaaaaaaaaaaaaaaaaaaaaa'); raise exception 'cross user write permitted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
do $$ begin
 if (select count(*) from public.avara_messages)<>0 then raise exception 'private message leak'; end if;
 if (select count(*) from public.avara_favorites)<>0 then raise exception 'favorite leak'; end if;
end $$;
reset role;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000004'),('00000000-0000-4000-8000-000000000005');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
do $$ begin
 begin insert into public.avara_profiles(id,display_name,role) values('00000000-0000-4000-8000-000000000004','Escalation','admin'); raise exception 'role escalation on insert'; exception when insufficient_privilege then null; end;
 begin insert into public.avara_profiles(id,display_name) values('00000000-0000-4000-8000-000000000005','Wrong user'); raise exception 'cross user provisioning'; exception when insufficient_privilege then null; end;
 insert into public.avara_profiles(id,display_name,manager_requested_at) values('00000000-0000-4000-8000-000000000004','New customer',now());
 if (select role from public.avara_profiles where id='00000000-0000-4000-8000-000000000004')<>'customer' then raise exception 'default role mismatch'; end if;
end $$;
reset role;
rollback;
