-- Migration: Security fixes
-- Date: 2024-12-02
--
-- Fixes:
-- 1. Add WITH CHECK clause to user update policy
-- 2. Add FORCE ROW LEVEL SECURITY to all tables
-- 3. Add WITH CHECK to profile_stories insert policy

-- Drop and recreate user update policy with WITH CHECK
DROP POLICY IF EXISTS "Users can update own record" ON users;
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS cannot be bypassed by superusers/table owners
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE work_stories FORCE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE profile_stories FORCE ROW LEVEL SECURITY;

-- Drop and recreate profile_stories insert policy with additional story ownership check
-- This adds a database-level check that the story belongs to the same user as the profile
DROP POLICY IF EXISTS "users can insert own profile_stories" ON profile_stories;
CREATE POLICY "users can insert own profile_stories"
  ON profile_stories FOR INSERT
  WITH CHECK (
    -- Check 1: User owns the profile
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_stories.profile_id
      AND profiles.user_id = auth.uid()
    )
    AND
    -- Check 2: User owns the story being added (CRITICAL security fix)
    EXISTS (
      SELECT 1 FROM work_stories
      WHERE work_stories.id = profile_stories.work_story_id
      AND work_stories.user_id = auth.uid()
    )
  );

-- Also update the profile_stories update policy if it exists
DROP POLICY IF EXISTS "users can update own profile_stories" ON profile_stories;
CREATE POLICY "users can update own profile_stories"
  ON profile_stories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_stories.profile_id
      AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_stories.profile_id
      AND profiles.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM work_stories
      WHERE work_stories.id = profile_stories.work_story_id
      AND work_stories.user_id = auth.uid()
    )
  );
