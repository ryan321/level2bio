-- Migration: Remove status column from work_stories
-- Stories no longer have draft/published status - they can be added to profiles at any time

-- Drop the RLS policy that references status column
DROP POLICY IF EXISTS "Anyone can view published stories via share link" ON work_stories;

-- Drop the index on status column
DROP INDEX IF EXISTS work_stories_status_idx;

-- Remove the status column (CASCADE will drop the check constraint)
ALTER TABLE work_stories DROP COLUMN status CASCADE;

-- Note: The previous migration (005_profiles.sql) filtered by status='published'
-- when migrating share_links to profiles. Going forward, all stories are eligible
-- to be added to profiles.
