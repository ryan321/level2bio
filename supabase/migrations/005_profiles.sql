-- Migration: Add profiles and profile_stories tables
-- This replaces the simple share_links model with curated profiles that can contain multiple stories

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  headline TEXT,  -- optional override of user's headline
  bio TEXT,       -- optional override of user's bio
  share_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,  -- optional expiration
  view_count INT DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create profile_stories join table
CREATE TABLE profile_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  work_story_id UUID REFERENCES work_stories(id) ON DELETE CASCADE NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  UNIQUE(profile_id, work_story_id)
);

-- Indexes
CREATE INDEX profiles_user_id_idx ON profiles(user_id);
CREATE INDEX profiles_share_token_idx ON profiles(share_token);
CREATE INDEX profile_stories_profile_id_idx ON profile_stories(profile_id);
CREATE INDEX profile_stories_work_story_id_idx ON profile_stories(work_story_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_stories ENABLE ROW LEVEL SECURITY;

-- Migrate existing share_links to profiles
-- Each existing share_link becomes a profile named "Default Profile" with all published stories
INSERT INTO profiles (user_id, name, share_token, is_active, view_count, last_viewed_at, created_at)
SELECT
  user_id,
  'Default Profile',
  token,
  is_active,
  view_count,
  last_viewed_at,
  created_at
FROM share_links;

-- Add all published stories to the migrated profiles
INSERT INTO profile_stories (profile_id, work_story_id, display_order)
SELECT
  p.id,
  ws.id,
  ws.display_order
FROM profiles p
JOIN work_stories ws ON ws.user_id = p.user_id
WHERE ws.status = 'published';

-- RLS Policies for profiles

-- Users can view their own profiles
CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own profiles
CREATE POLICY "Users can insert own profiles"
  ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own profiles
CREATE POLICY "Users can update own profiles"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own profiles
CREATE POLICY "Users can delete own profiles"
  ON profiles FOR DELETE
  USING (user_id = auth.uid());

-- Anyone can view active profiles by share token (for public profile viewing)
CREATE POLICY "Anyone can view active profiles by token"
  ON profiles FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- RLS Policies for profile_stories

-- Users can view profile_stories for their own profiles
CREATE POLICY "Users can view own profile_stories"
  ON profile_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_stories.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Users can insert profile_stories for their own profiles
CREATE POLICY "Users can insert own profile_stories"
  ON profile_stories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_stories.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Users can update profile_stories for their own profiles
CREATE POLICY "Users can update own profile_stories"
  ON profile_stories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_stories.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Users can delete profile_stories for their own profiles
CREATE POLICY "Users can delete own profile_stories"
  ON profile_stories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_stories.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Anyone can view profile_stories for active profiles (for public viewing)
CREATE POLICY "Anyone can view profile_stories for active profiles"
  ON profile_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_stories.profile_id
      AND profiles.is_active = true
      AND (profiles.expires_at IS NULL OR profiles.expires_at > now())
    )
  );

-- Update public access policies for users and work_stories
-- These allow anonymous access when viewing via a valid profile token

-- Drop old share_links-based policies
DROP POLICY IF EXISTS "Public can view users via share link" ON users;
DROP POLICY IF EXISTS "Public can view published stories via share link" ON work_stories;

-- Users are viewable if they have an active profile
CREATE POLICY "Public can view users via profile"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = users.id
      AND profiles.is_active = true
      AND (profiles.expires_at IS NULL OR profiles.expires_at > now())
    )
  );

-- Work stories are viewable if they're in an active profile
CREATE POLICY "Public can view stories via profile"
  ON work_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profile_stories ps
      JOIN profiles p ON p.id = ps.profile_id
      WHERE ps.work_story_id = work_stories.id
      AND p.is_active = true
      AND (p.expires_at IS NULL OR p.expires_at > now())
    )
  );

-- Drop old share_links policies (table will be dropped after migration verified)
DROP POLICY IF EXISTS "Users can view own share link" ON share_links;
DROP POLICY IF EXISTS "Users can insert own share link" ON share_links;
DROP POLICY IF EXISTS "Users can update own share link" ON share_links;
DROP POLICY IF EXISTS "Anyone can view active share links by token" ON share_links;

-- Note: We keep the share_links table for now in case rollback is needed.
-- A future migration can drop it once profiles are verified working.
-- DROP TABLE share_links;
