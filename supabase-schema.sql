-- ============================================================
-- SocialVerse - Complete Supabase Schema
-- Run this ENTIRE file in SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default 'New',
  last_name text not null default 'User',
  email text,
  avatar_url text,
  cover_url text,
  bio text default '',
  location text default '',
  workplace text default '',
  education text default '',
  relationship text default '',
  website text default '',
  created_at timestamptz default now()
);

-- POSTS (image_url for single image upload)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  content text default '',
  image_url text,
  images text[] default '{}',
  privacy text default 'public',
  feeling text default '',
  location text default '',
  created_at timestamptz default now()
);

-- LIKES
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- REACTIONS (emoji reactions)
create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null default 'like',
  created_at timestamptz default now(),
  unique(post_id, user_id)
);


-- COMMENTS
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- FRIENDS
create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  friend_id uuid references profiles(id) on delete cascade not null,
  status text default 'pending',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- CONVERSATIONS
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid references profiles(id) on delete cascade not null,
  user2_id uuid references profiles(id) on delete cascade not null,
  last_message text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- MESSAGES
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  from_user_id uuid references profiles(id) on delete cascade,
  type text not null default 'general',
  content text not null,
  read boolean default false,
  reference_id uuid,
  post_id uuid references posts(id) on delete set null,
  created_at timestamptz default now()
);

-- STORIES
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  content text default '',
  image_url text,
  bg_color text default '#1877f2',
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- STORY VIEWS
create table if not exists story_views (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  viewed_at timestamptz default now(),
  unique(story_id, user_id)
);

-- GROUPS
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  cover_url text default '',
  privacy text default 'public',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- GROUP MEMBERS
create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text default 'member',
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- PAGES
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default '',
  description text default '',
  avatar_url text default '',
  cover_url text default '',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- PAGE LIKES
create table if not exists page_likes (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(page_id, user_id)
);

-- MARKETPLACE ITEMS
create table if not exists marketplace_items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text default '',
  price numeric default 0,
  category text default 'other',
  condition text default 'Good',
  location text default '',
  image_url text,
  status text default 'available',
  created_at timestamptz default now()
);


-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table posts enable row level security;
alter table likes enable row level security;
alter table reactions enable row level security;
alter table comments enable row level security;
alter table friends enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table stories enable row level security;
alter table story_views enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table pages enable row level security;
alter table page_likes enable row level security;
alter table marketplace_items enable row level security;

-- ============================================================
-- RLS POLICIES
-- ============================================================
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

create policy "posts_select" on posts for select using (true);
create policy "posts_insert" on posts for insert with check (auth.uid() = user_id);
create policy "posts_update" on posts for update using (auth.uid() = user_id);
create policy "posts_delete" on posts for delete using (auth.uid() = user_id);

create policy "likes_select" on likes for select using (true);
create policy "likes_insert" on likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on likes for delete using (auth.uid() = user_id);

create policy "reactions_select" on reactions for select using (true);
create policy "reactions_insert" on reactions for insert with check (auth.uid() = user_id);
create policy "reactions_update" on reactions for update using (auth.uid() = user_id);
create policy "reactions_delete" on reactions for delete using (auth.uid() = user_id);

create policy "comments_select" on comments for select using (true);
create policy "comments_insert" on comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on comments for delete using (auth.uid() = user_id);

create policy "friends_select" on friends for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "friends_insert" on friends for insert with check (auth.uid() = user_id);
create policy "friends_update" on friends for update using (auth.uid() = friend_id or auth.uid() = user_id);
create policy "friends_delete" on friends for delete using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "conversations_select" on conversations for select using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "conversations_insert" on conversations for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "conversations_update" on conversations for update using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "messages_select" on messages for select using (
  exists (select 1 from conversations c where c.id = messages.conversation_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "messages_insert" on messages for insert with check (auth.uid() = sender_id);

create policy "notifications_select" on notifications for select using (auth.uid() = user_id);
create policy "notifications_insert" on notifications for insert with check (true);
create policy "notifications_update" on notifications for update using (auth.uid() = user_id);

create policy "stories_select" on stories for select using (true);
create policy "stories_insert" on stories for insert with check (auth.uid() = user_id);
create policy "stories_delete" on stories for delete using (auth.uid() = user_id);

create policy "story_views_select" on story_views for select using (true);
create policy "story_views_insert" on story_views for insert with check (auth.uid() = user_id);

create policy "groups_select" on groups for select using (true);
create policy "groups_insert" on groups for insert with check (auth.uid() = created_by);

create policy "group_members_select" on group_members for select using (true);
create policy "group_members_insert" on group_members for insert with check (auth.uid() = user_id);
create policy "group_members_delete" on group_members for delete using (auth.uid() = user_id);

create policy "pages_select" on pages for select using (true);
create policy "pages_insert" on pages for insert with check (auth.uid() = created_by);

create policy "page_likes_select" on page_likes for select using (true);
create policy "page_likes_insert" on page_likes for insert with check (auth.uid() = user_id);
create policy "page_likes_delete" on page_likes for delete using (auth.uid() = user_id);

create policy "marketplace_select" on marketplace_items for select using (true);
create policy "marketplace_insert" on marketplace_items for insert with check (auth.uid() = seller_id);
create policy "marketplace_update" on marketplace_items for update using (auth.uid() = seller_id);
create policy "marketplace_delete" on marketplace_items for delete using (auth.uid() = seller_id);


-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name, last_name, email, avatar_url, cover_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'New'),
    coalesce(new.raw_user_meta_data->>'last_name', 'User'),
    new.email,
    'https://ui-avatars.com/api/?name=' || coalesce(new.raw_user_meta_data->>'first_name', 'U') || '&background=1877f2&color=fff&size=150',
    'https://picsum.photos/seed/' || new.id::text || '/1200/400'
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create profile for any existing users without one
insert into profiles (id, first_name, last_name, email, avatar_url, cover_url)
select id,
  coalesce(raw_user_meta_data->>'first_name', 'New'),
  coalesce(raw_user_meta_data->>'last_name', 'User'),
  email,
  'https://ui-avatars.com/api/?name=' || coalesce(raw_user_meta_data->>'first_name', 'U') || '&background=1877f2&color=fff&size=150',
  'https://picsum.photos/seed/' || id::text || '/1200/400'
from auth.users
where id not in (select id from profiles)
on conflict (id) do nothing;

-- ============================================================
-- ENABLE REALTIME FOR MESSAGES (for live chat)
-- ============================================================
alter publication supabase_realtime add table messages;

-- ============================================================
-- STORAGE BUCKETS (run in SQL or create manually in Dashboard)
-- Go to Storage in Dashboard and create these buckets:
--   1. 'posts' - public bucket for post images
--   2. 'avatars' - public bucket for profile pictures
--   3. 'covers' - public bucket for cover photos
--   4. 'stories' - public bucket for story images
--   5. 'marketplace' - public bucket for marketplace item images
--
-- For each bucket, set the policy to allow authenticated uploads:
--   - Allow uploads: (bucket_id = 'posts' AND auth.role() = 'authenticated')
--   - Allow public reads: (bucket_id = 'posts')
-- ============================================================

-- Create storage buckets via SQL (may need to be done in Dashboard if this errors)
insert into storage.buckets (id, name, public) values ('posts', 'posts', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('stories', 'stories', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('marketplace', 'marketplace', true) on conflict do nothing;

-- Storage policies
create policy "Public read" on storage.objects for select using (true);
create policy "Auth upload" on storage.objects for insert with check (auth.role() = 'authenticated');
create policy "Auth update own" on storage.objects for update using (auth.uid()::text = (storage.foldername(name))[1]);
create policy "Auth delete own" on storage.objects for delete using (auth.uid()::text = (storage.foldername(name))[1]);
