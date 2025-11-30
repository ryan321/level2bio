-- Fix: RLS policy recursion
--
-- Problem: users and share_links policies referenced each other causing infinite recursion.
--
-- Solution: Use SECURITY DEFINER functions to check cross-table conditions without
-- triggering RLS on the other table. This is the standard Supabase pattern.

-- Helper function: Check if a user has an active share link (bypasses RLS)
create or replace function has_active_share_link(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from share_links
    where user_id = check_user_id and is_active = true
  );
$$;

-- Helper function: Get user_id from auth_id (bypasses RLS)
create or replace function get_user_id_from_auth()
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from users where auth_id = auth.uid() limit 1;
$$;

-- Drop all existing policies to recreate them properly
drop policy if exists "Users can view own record" on users;
drop policy if exists "Users can update own record" on users;
drop policy if exists "Users can insert own record" on users;
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

-- ===================
-- USERS POLICIES
-- ===================

-- Authenticated users can view their own record
create policy "Users can view own record"
  on users for select
  using (auth.uid() = auth_id);

-- Authenticated users can update their own record
create policy "Users can update own record"
  on users for update
  using (auth.uid() = auth_id);

-- Allow inserting new users (for signup - auth.uid() will match the new auth_id)
create policy "Users can insert own record"
  on users for insert
  with check (auth.uid() = auth_id);

-- Public: Anyone can view users who have active share links
-- Uses security definer function to avoid recursion
create policy "Anyone can view user profile via share link"
  on users for select
  using (has_active_share_link(id));

-- ===================
-- WORK STORIES POLICIES
-- ===================

-- Authenticated users can view their own stories
create policy "Users can view own stories"
  on work_stories for select
  using (user_id = get_user_id_from_auth());

-- Authenticated users can insert their own stories
create policy "Users can insert own stories"
  on work_stories for insert
  with check (user_id = get_user_id_from_auth());

-- Authenticated users can update their own stories
create policy "Users can update own stories"
  on work_stories for update
  using (user_id = get_user_id_from_auth());

-- Authenticated users can delete their own stories
create policy "Users can delete own stories"
  on work_stories for delete
  using (user_id = get_user_id_from_auth());

-- Public: Anyone can view published stories for users with active share links
create policy "Anyone can view published stories via share link"
  on work_stories for select
  using (
    status = 'published'
    and has_active_share_link(user_id)
  );

-- ===================
-- SHARE LINKS POLICIES
-- ===================

-- Authenticated users can view their own share link
create policy "Users can view own share link"
  on share_links for select
  using (user_id = get_user_id_from_auth());

-- Authenticated users can insert their own share link
create policy "Users can insert own share link"
  on share_links for insert
  with check (user_id = get_user_id_from_auth());

-- Authenticated users can update their own share link
create policy "Users can update own share link"
  on share_links for update
  using (user_id = get_user_id_from_auth());

-- Public: Anyone can view active share links (needed for token lookup)
create policy "Anyone can view active share links by token"
  on share_links for select
  using (is_active = true);
