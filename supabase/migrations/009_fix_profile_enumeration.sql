-- Migration 009: Fix profile enumeration vulnerability
--
-- Problem: Current RLS policies allow enumeration of all active profiles and their stories.
--          Any user (auth or anon) can run: SELECT * FROM profiles WHERE is_active = true
--          and get ALL active profiles, not just ones they have a token for.
--
-- Solution: Remove public SELECT policies and force all public access through
--           SECURITY DEFINER functions that require a valid share_token.
--
-- Security properties after this migration:
--   - SELECT * FROM profiles (anon) → Empty
--   - SELECT * FROM profiles (auth) → Only own profiles
--   - SELECT * FROM work_stories (anon) → Empty
--   - SELECT * FROM work_stories (auth) → Only own stories
--   - rpc('get_public_profile', {token: 'valid'}) → That one profile
--   - rpc('get_public_profile', {token: 'invalid'}) → Empty

-- =============================================================================
-- 1. DROP ORPHANED SHARE_LINKS-ERA POLICIES
--    These were created in 003 but never properly dropped when profiles replaced share_links
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view published stories via share link" ON work_stories;
DROP POLICY IF EXISTS "Anyone can view user profile via share link" ON users;

-- =============================================================================
-- 2. DROP ENUMERABLE PUBLIC POLICIES
--    These allow listing all active profiles/stories without knowing the token
-- =============================================================================
DROP POLICY IF EXISTS "Public can view profile by share token" ON profiles;
DROP POLICY IF EXISTS "Public can view stories via profile" ON work_stories;
DROP POLICY IF EXISTS "Public can view users via profile" ON users;
DROP POLICY IF EXISTS "Anyone can view profile_stories for active profiles" ON profile_stories;

-- =============================================================================
-- 3. CREATE SECURE ACCESS FUNCTIONS
--    These require a valid share_token - no enumeration possible
-- =============================================================================

-- Get profile + user info by share token
-- Returns profile data with user info, applying headline/bio overrides
CREATE OR REPLACE FUNCTION get_public_profile(p_share_token TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  headline TEXT,
  bio TEXT,
  share_token TEXT,
  view_count INT,
  created_at TIMESTAMPTZ,
  -- User info
  user_name TEXT,
  user_headline TEXT,
  user_bio TEXT,
  user_profile_photo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.name,
    -- Apply profile overrides: use profile.headline if set, otherwise user.headline
    COALESCE(p.headline, u.headline) AS headline,
    COALESCE(p.bio, u.bio) AS bio,
    p.share_token,
    p.view_count,
    p.created_at,
    u.name AS user_name,
    u.headline AS user_headline,
    u.bio AS user_bio,
    u.profile_photo_url AS user_profile_photo_url
  FROM profiles p
  JOIN users u ON u.id = p.user_id
  WHERE p.share_token = p_share_token
    AND p.is_active = true
    AND (p.expires_at IS NULL OR p.expires_at > now());
END;
$$;

-- Get stories for a profile by share token
-- Returns work stories that are in the specified profile, ordered by display_order
CREATE OR REPLACE FUNCTION get_public_profile_stories(p_share_token TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  template_type TEXT,
  responses JSONB,
  video_url TEXT,
  assets JSONB,
  display_order INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ws.id,
    ws.title,
    ws.template_type,
    ws.responses,
    ws.video_url,
    ws.assets,
    ps.display_order,
    ws.created_at,
    ws.updated_at
  FROM work_stories ws
  JOIN profile_stories ps ON ps.work_story_id = ws.id
  JOIN profiles p ON p.id = ps.profile_id
  WHERE p.share_token = p_share_token
    AND p.is_active = true
    AND (p.expires_at IS NULL OR p.expires_at > now())
  ORDER BY ps.display_order;
END;
$$;

-- =============================================================================
-- 4. GRANT PERMISSIONS
--    Allow both anonymous and authenticated users to call these functions
-- =============================================================================
GRANT EXECUTE ON FUNCTION get_public_profile(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_public_profile(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_profile_stories(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_public_profile_stories(TEXT) TO authenticated;
