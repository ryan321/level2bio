-- Migration: Fix SECURITY DEFINER function search_path
--
-- Security: SECURITY DEFINER functions should always set search_path to prevent
-- privilege escalation attacks where a malicious user could create objects in
-- a schema that gets searched before 'public'.
--
-- This migration fixes increment_profile_view which was missing SET search_path.

-- =============================================================================
-- FIX: Add SET search_path to increment_profile_view
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_profile_view(p_share_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    view_count = view_count + 1,
    last_viewed_at = now()
  WHERE share_token = p_share_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;

-- Permissions already granted in migration 007, but ensure they exist
GRANT EXECUTE ON FUNCTION increment_profile_view(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION increment_profile_view(TEXT) TO authenticated;
