-- Fix: Add auth_id column to properly link users table with Supabase Auth
-- The original schema used `id` for RLS policies, but Supabase Auth uses separate UUIDs

-- Add auth_id column that references Supabase Auth users
alter table users add column auth_id uuid unique;

-- Drop existing policies that use incorrect auth check
drop policy if exists "Users can view own record" on users;
drop policy if exists "Users can update own record" on users;
drop policy if exists "Anyone can view user profile via share link" on users;

drop policy if exists "Users can view own stories" on work_stories;
drop policy if exists "Users can insert own stories" on work_stories;
drop policy if exists "Users can update own stories" on work_stories;
drop policy if exists "Users can delete own stories" on work_stories;
drop policy if exists "Anyone can view published stories via share link" on work_stories;

drop policy if exists "Users can view own share link" on share_links;
drop policy if exists "Users can insert own share link" on share_links;
drop policy if exists "Users can update own share link" on share_links;
drop policy if exists "Anyone can view active share links by token" on share_links;

-- Recreate policies using auth_id

-- Users policies
create policy "Users can view own record"
  on users for select
  using (auth.uid() = auth_id);

create policy "Users can update own record"
  on users for update
  using (auth.uid() = auth_id);

create policy "Users can insert own record"
  on users for insert
  with check (auth.uid() = auth_id);

create policy "Anyone can view user profile via share link"
  on users for select
  using (
    exists (
      select 1 from share_links
      where share_links.user_id = users.id
      and share_links.is_active = true
    )
  );

-- Work stories policies
create policy "Users can view own stories"
  on work_stories for select
  using (
    exists (
      select 1 from users
      where users.id = work_stories.user_id
      and users.auth_id = auth.uid()
    )
  );

create policy "Users can insert own stories"
  on work_stories for insert
  with check (
    exists (
      select 1 from users
      where users.id = work_stories.user_id
      and users.auth_id = auth.uid()
    )
  );

create policy "Users can update own stories"
  on work_stories for update
  using (
    exists (
      select 1 from users
      where users.id = work_stories.user_id
      and users.auth_id = auth.uid()
    )
  );

create policy "Users can delete own stories"
  on work_stories for delete
  using (
    exists (
      select 1 from users
      where users.id = work_stories.user_id
      and users.auth_id = auth.uid()
    )
  );

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

-- Share links policies
create policy "Users can view own share link"
  on share_links for select
  using (
    exists (
      select 1 from users
      where users.id = share_links.user_id
      and users.auth_id = auth.uid()
    )
  );

create policy "Users can insert own share link"
  on share_links for insert
  with check (
    exists (
      select 1 from users
      where users.id = share_links.user_id
      and users.auth_id = auth.uid()
    )
  );

create policy "Users can update own share link"
  on share_links for update
  using (
    exists (
      select 1 from users
      where users.id = share_links.user_id
      and users.auth_id = auth.uid()
    )
  );

create policy "Anyone can view active share links by token"
  on share_links for select
  using (is_active = true);

-- Create index on auth_id for faster lookups
create index users_auth_id_idx on users(auth_id);
