
-- 1) Account type enum
do $$ begin
  create type public.account_type as enum ('artist','architect','builder','designer','photographer','engineer','studio','other');
exception when duplicate_object then null; end $$;

alter table public.profiles add column if not exists account_type public.account_type not null default 'other';

-- update handle_new_user to capture account_type from metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6),
    coalesce((new.raw_user_meta_data->>'account_type')::public.account_type, 'other')
  );
  return new;
end; $$;

-- 2) Views / likes counters on projects
alter table public.projects add column if not exists views_count integer not null default 0;
alter table public.projects add column if not exists likes_count integer not null default 0;

create or replace function public.increment_project_views(_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.projects set views_count = views_count + 1 where id = _id;
$$;

create or replace function public.increment_work_views(_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.works set views_count = views_count + 1 where id = _id;
$$;

-- 3) Likes (polymorphic over work | project)
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  target_type text not null check (target_type in ('work','project')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
alter table public.likes enable row level security;
drop policy if exists "Likes viewable by everyone" on public.likes;
create policy "Likes viewable by everyone" on public.likes for select using (true);
drop policy if exists "Users insert own likes" on public.likes;
create policy "Users insert own likes" on public.likes for insert with check (auth.uid() = user_id);
drop policy if exists "Users delete own likes" on public.likes;
create policy "Users delete own likes" on public.likes for delete using (auth.uid() = user_id);

create or replace function public.bump_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare delta int;
begin
  if tg_op = 'INSERT' then delta := 1;
  elsif tg_op = 'DELETE' then delta := -1;
  else return null;
  end if;
  if (coalesce(new.target_type, old.target_type)) = 'work' then
    update public.works set likes_count = greatest(0, likes_count + delta) where id = coalesce(new.target_id, old.target_id);
  else
    update public.projects set likes_count = greatest(0, likes_count + delta) where id = coalesce(new.target_id, old.target_id);
  end if;
  return null;
end; $$;

drop trigger if exists likes_bump_ins on public.likes;
create trigger likes_bump_ins after insert on public.likes for each row execute function public.bump_like_count();
drop trigger if exists likes_bump_del on public.likes;
create trigger likes_bump_del after delete on public.likes for each row execute function public.bump_like_count();

-- 4) Favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  target_type text not null check (target_type in ('work','project')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
alter table public.favorites enable row level security;
drop policy if exists "Users view own favorites" on public.favorites;
create policy "Users view own favorites" on public.favorites for select using (auth.uid() = user_id);
drop policy if exists "Users insert own favorites" on public.favorites;
create policy "Users insert own favorites" on public.favorites for insert with check (auth.uid() = user_id);
drop policy if exists "Users delete own favorites" on public.favorites;
create policy "Users delete own favorites" on public.favorites for delete using (auth.uid() = user_id);

-- 5) Guest messaging — allow nullable client_id and add guest fields
alter table public.threads add column if not exists guest_name text;
alter table public.threads add column if not exists guest_email text;
alter table public.threads alter column client_id drop not null;

drop policy if exists "Authed users start thread" on public.threads;
create policy "Anyone can start a thread" on public.threads
  for insert with check (
    (auth.uid() = client_id)
    or (client_id is null and guest_email is not null and guest_name is not null)
  );
drop policy if exists "Thread parties view" on public.threads;
create policy "Thread parties or recipients view" on public.threads
  for select using (
    auth.uid() = client_id or auth.uid() = creative_id
  );

-- Allow guests to send the first message: messages from a null sender_id when matching thread has null client_id
alter table public.messages alter column sender_id drop not null;
drop policy if exists "Thread parties send messages" on public.messages;
create policy "Parties or guests send messages" on public.messages
  for insert with check (
    (auth.uid() = sender_id)
    or (sender_id is null and exists (
      select 1 from public.threads t where t.id = thread_id and t.client_id is null
    ))
  );
