-- ============================================================
-- FACEBOOK CLONE - Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
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

-- 2. POSTS
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  images text[] default '{}',
  privacy text default 'public' check (privacy in ('public','friends','private')),
  feeling text default '',
  location text default '',
  created_at timestamptz default now()
);

-- 3. LIKES
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- 4. COMMENTS
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- 5. FRIENDS
create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  friend_id uuid references profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz default now()
);


-- 6. CONVERSATIONS
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid references profiles(id) on delete cascade not null,
  user2_id uuid references profiles(id) on delete cascade not null,
  last_message text default '',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 7. MESSAGES
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- 8. NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  from_user_id uuid references profiles(id) on delete cascade,
  type text not null,
  content text not null,
  read boolean default false,
  post_id uuid references posts(id) on delete set null,
  created_at timestamptz default now()
);

-- 9. STORIES
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text default 'text' check (type in ('text','image')),
  content text default '',
  media_url text default '',
  bg_color text default '#1877f2',
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- 10. GROUPS
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  cover_url text default '',
  privacy text default 'public' check (privacy in ('public','private')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 11. GROUP MEMBERS
create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('admin','moderator','member')),
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- 12. PAGES
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

-- 13. PAGE LIKES
create table if not exists page_likes (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(page_id, user_id)
);

-- 14. MARKETPLACE ITEMS
create table if not exists marketplace_items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text default '',
  price numeric default 0,
  category text default 'Other',
  condition text default 'Good',
  location text default '',
  image_url text default '',
  status text default 'available' check (status in ('available','sold','removed')),
  created_at timestamptz default now()
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table posts enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table friends enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table stories enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table pages enable row level security;
alter table page_likes enable row level security;
alter table marketplace_items enable row level security;

-- PROFILES: anyone can read, users can update their own
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- POSTS: public posts visible to all, users can CRUD their own
create policy "Posts are viewable by everyone" on posts for select using (true);
create policy "Users can create posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on posts for delete using (auth.uid() = user_id);

-- LIKES: anyone can read, authenticated users can like
create policy "Likes are viewable" on likes for select using (true);
create policy "Users can like" on likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on likes for delete using (auth.uid() = user_id);

-- COMMENTS: anyone can read, authenticated users can comment
create policy "Comments are viewable" on comments for select using (true);
create policy "Users can comment" on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

-- FRIENDS: users can see their own friendships
create policy "Users can view friendships" on friends for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users can send requests" on friends for insert with check (auth.uid() = user_id);
create policy "Users can update requests sent to them" on friends for update using (auth.uid() = friend_id);
create policy "Users can delete friendships" on friends for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- CONVERSATIONS: participants can see their convos
create policy "Users can view own conversations" on conversations for select using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Users can create conversations" on conversations for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Users can update own conversations" on conversations for update using (auth.uid() = user1_id or auth.uid() = user2_id);

-- MESSAGES: conversation participants can read
create policy "Users can view messages in their convos" on messages for select using (
  exists (select 1 from conversations c where c.id = messages.conversation_id and (c.user1_id = auth.uid() or c.user2_id = auth.uid()))
);
create policy "Users can send messages" on messages for insert with check (auth.uid() = sender_id);

-- NOTIFICATIONS: users see their own
create policy "Users can view own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can create notifications" on notifications for insert with check (true);
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);

-- STORIES: visible to all
create policy "Stories are viewable" on stories for select using (true);
create policy "Users can create stories" on stories for insert with check (auth.uid() = user_id);
create policy "Users can delete own stories" on stories for delete using (auth.uid() = user_id);

-- GROUPS: visible to all
create policy "Groups are viewable" on groups for select using (true);
create policy "Users can create groups" on groups for insert with check (auth.uid() = created_by);

-- GROUP MEMBERS: visible to all
create policy "Group members viewable" on group_members for select using (true);
create policy "Users can join groups" on group_members for insert with check (auth.uid() = user_id);
create policy "Users can leave groups" on group_members for delete using (auth.uid() = user_id);

-- PAGES: visible to all
create policy "Pages are viewable" on pages for select using (true);
create policy "Users can create pages" on pages for insert with check (auth.uid() = created_by);

-- PAGE LIKES: visible to all
create policy "Page likes viewable" on page_likes for select using (true);
create policy "Users can like pages" on page_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike pages" on page_likes for delete using (auth.uid() = user_id);

-- MARKETPLACE: visible to all
create policy "Marketplace items viewable" on marketplace_items for select using (true);
create policy "Users can create listings" on marketplace_items for insert with check (auth.uid() = seller_id);
create policy "Users can update own listings" on marketplace_items for update using (auth.uid() = seller_id);
create policy "Users can delete own listings" on marketplace_items for delete using (auth.uid() = seller_id);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, avatar_url, cover_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'New'),
    coalesce(new.raw_user_meta_data->>'last_name', 'User'),
    new.email,
    'https://i.pravatar.cc/150?img=' || floor(random() * 70)::text,
    'https://picsum.photos/seed/' || new.id::text || '/1200/400'
  );
  return new;
exception when others then
  return new;
end;
$$;

-- Drop existing trigger if exists and create new
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
