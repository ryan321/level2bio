-- Level2.bio Initial Schema
-- Run this migration to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table users (
  id uuid primary key default gen_random_uuid(),
  linkedin_id text unique not null,
  email text unique,
  name text not null,
  headline text,
  bio text,
  profile_photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Work stories table
create table work_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  template_type text not null check (template_type in ('project', 'role_highlight', 'lessons_learned')),
  title text not null,
  responses jsonb not null default '{}',
  video_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  display_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Share links table
create table share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique not null,
  token text unique not null,
  is_active boolean default false,
  view_count int default 0,
  last_viewed_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index work_stories_user_id_idx on work_stories(user_id);
create index work_stories_status_idx on work_stories(status);
create index share_links_token_idx on share_links(token);
create index share_links_is_active_idx on share_links(is_active);

-- Updated at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to tables
create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();

create trigger work_stories_updated_at
  before update on work_stories
  for each row execute function update_updated_at();

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
alter table users enable row level security;
alter table work_stories enable row level security;
alter table share_links enable row level security;

-- Users: users can only see/edit their own record
create policy "Users can view own record"
  on users for select
  using (auth.uid() = id);

create policy "Users can update own record"
  on users for update
  using (auth.uid() = id);

-- Work stories: users can CRUD their own stories
create policy "Users can view own stories"
  on work_stories for select
  using (auth.uid() = user_id);

create policy "Users can insert own stories"
  on work_stories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stories"
  on work_stories for update
  using (auth.uid() = user_id);

create policy "Users can delete own stories"
  on work_stories for delete
  using (auth.uid() = user_id);

-- Share links: users can manage their own share link
create policy "Users can view own share link"
  on share_links for select
  using (auth.uid() = user_id);

create policy "Users can insert own share link"
  on share_links for insert
  with check (auth.uid() = user_id);

create policy "Users can update own share link"
  on share_links for update
  using (auth.uid() = user_id);

-- Public access for viewers (via share token)
-- This allows anyone with a valid token to view published stories

create policy "Anyone can view active share links by token"
  on share_links for select
  using (is_active = true);

create policy "Anyone can view published stories via share link"
  on work_stories for select
  using (
    status = 'published'
    and exists (
      select 1 from share_links
      where share_links.user_id = work_stories.user_id
      and share_links.is_active = true
    )
  );

create policy "Anyone can view user profile via share link"
  on users for select
  using (
    exists (
      select 1 from share_links
      where share_links.user_id = users.id
      and share_links.is_active = true
    )
  );

-- Function to increment view count
create or replace function increment_view_count(share_token text)
returns void as $$
begin
  update share_links
  set
    view_count = view_count + 1,
    last_viewed_at = now()
  where token = share_token and is_active = true;
end;
$$ language plpgsql security definer;
