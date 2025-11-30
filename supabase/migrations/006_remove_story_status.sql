-- Migration: Remove status column from work_stories
-- Stories no longer have draft/published status - they can be added to profiles at any time

-- Drop any RLS policies that reference status
-- (Most were already migrated to use profiles, but clean up any remaining)

-- Remove the status column and its check constraint
ALTER TABLE work_stories DROP COLUMN status;

-- Update the profile migration query (already ran, but document the change)
-- Note: The previous migration (005_profiles.sql) filtered by status='published'
-- when migrating share_links to profiles. Going forward, all stories are eligible
-- to be added to profiles.
