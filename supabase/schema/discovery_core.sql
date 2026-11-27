-- Candidate schema for isolated validation. Do not apply to Freshpick or production.
begin;
create table public.avara_profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 legacy_mongo_id text unique check (legacy_mongo_id is null or legacy_mongo_id ~ '^[0-9a-f]{24}$'),
 display_name text not null check (char_length(display_name) between 2 and 120),
 phone text,
 role text not null default 'customer' check (role in ('customer','manager','admin','super_admin')),
 manager_requested_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.avara_properties (
 id text primary key default gen_random_uuid()::text check (id ~ '^[0-9a-f]{24}$' or id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
 owner_id uuid not null references public.avara_profiles(id) on delete restrict,
 title text not null check (char_length(title) between 1 and 200),
 description text not null check (char_length(description) between 1 and 12000),
 property_type text not null check (property_type in ('apartment','house','villa','bungalow','land','commercial','room','studio','penthouse','duplex','office','warehouse','shop','serviced-apartment')),
 purpose text not null check (purpose in ('rent','sale','booking')),
 status text not null default 'pending' check (status in ('pending','active','inactive','rejected','sold','rented')),
 price numeric(15,2) not null check (price >= 0 and price <= 1000000000000),
 currency text not null check (currency in ('LKR','USD')),
 rent_period text check (rent_period in ('monthly','weekly','daily')),
 city text not null check (char_length(city) between 1 and 120),
 district text not null check (char_length(district) between 1 and 120),
 bedrooms integer check (bedrooms >= 0),
 bathrooms integer check (bathrooms >= 0),
 area_sqft numeric check (area_sqft >= 0),
 images text[] not null default '{}',
 amenities text[] not null default '{}',
 verified boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((purpose = 'sale' and rent_period is null) or (purpose in ('rent','booking') and rent_period is not null))
);
create table public.avara_property_private (
 property_id text primary key references public.avara_properties(id) on delete cascade,
 street_address text,
 verification_notes text
);
create index avara_properties_discovery_idx on public.avara_properties(purpose,property_type,created_at desc,id) where status='active';
create index avara_properties_city_idx on public.avara_properties(lower(city),purpose,price) where status='active';
create index avara_properties_owner_idx on public.avara_properties(owner_id,created_at desc);
create table public.avara_favorites (
 user_id uuid not null references public.avara_profiles(id) on delete cascade,
 property_id text not null references public.avara_properties(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,property_id)
);
create table public.avara_conversations (
 id uuid primary key default gen_random_uuid(),
 property_id text not null references public.avara_properties(id) on delete restrict,
 seeker_id uuid not null references public.avara_profiles(id) on delete restrict,
 owner_id uuid not null references public.avara_profiles(id) on delete restrict,
 created_at timestamptz not null default now(),
 unique(property_id,seeker_id,owner_id), check(seeker_id<>owner_id)
);
create index avara_conversations_seeker_idx on public.avara_conversations(seeker_id,created_at desc);
create index avara_conversations_owner_idx on public.avara_conversations(owner_id,created_at desc);
create table public.avara_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.avara_conversations(id) on delete cascade,
 sender_id uuid not null references public.avara_profiles(id) on delete restrict,
 body text not null check(char_length(btrim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index avara_messages_thread_idx on public.avara_messages(conversation_id,created_at,id);
create table public.avara_conversation_blocks (
 conversation_id uuid not null references public.avara_conversations(id) on delete cascade,
 user_id uuid not null references public.avara_profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(conversation_id,user_id)
);
create table public.avara_moderation_events (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references public.avara_profiles(id) on delete restrict,
 property_id text not null references public.avara_properties(id) on delete restrict,
 action text not null check(action in ('approve','reject','unpublish')),
 reason text,
 created_at timestamptz not null default now()
);
-- Explicit grants, including when project defaults are permissive.
do $$ declare t text; begin
 foreach t in array array['avara_profiles','avara_properties','avara_property_private','avara_favorites','avara_conversations','avara_messages','avara_conversation_blocks','avara_moderation_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public, anon, authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to service_role',t);
 end loop;
end $$;
grant select(id,title,description,property_type,purpose,status,price,currency,rent_period,city,district,bedrooms,bathrooms,area_sqft,images,amenities,verified,created_at,updated_at) on public.avara_properties to anon,authenticated;
create policy avara_public_active on public.avara_properties for select to anon,authenticated using(status='active');
grant select on public.avara_profiles to authenticated;
create policy avara_profile_self on public.avara_profiles for select to authenticated using(id=(select auth.uid()));
grant select,insert,delete on public.avara_favorites to authenticated;
create policy avara_favorites_read on public.avara_favorites for select to authenticated using(user_id=(select auth.uid()));
create policy avara_favorites_insert on public.avara_favorites for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.avara_properties p where p.id=property_id and p.status='active'));
create policy avara_favorites_delete on public.avara_favorites for delete to authenticated using(user_id=(select auth.uid()));
grant select on public.avara_conversations,public.avara_messages,public.avara_conversation_blocks to authenticated;
create policy avara_threads_participant on public.avara_conversations for select to authenticated using((select auth.uid()) in (seeker_id,owner_id));
create policy avara_messages_participant on public.avara_messages for select to authenticated using(exists(select 1 from public.avara_conversations c where c.id=conversation_id and (select auth.uid()) in(c.seeker_id,c.owner_id)));
create policy avara_blocks_participant on public.avara_conversation_blocks for select to authenticated using(exists(select 1 from public.avara_conversations c where c.id=conversation_id and (select auth.uid()) in(c.seeker_id,c.owner_id)));
-- All privileged changes, profile provisioning, moderation and message sends require reviewed server operations.
commit;
