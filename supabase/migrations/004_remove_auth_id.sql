-- Remove auth_id column - use id directly as auth.uid()
-- This simplifies the schema: users.id = Supabase Auth user id

-- Drop all existing policies FIRST (before dropping column)
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;
DROP POLICY IF EXISTS "Anyone can view user profile via share link" ON users;

DROP POLICY IF EXISTS "Users can view own stories" ON work_stories;
DROP POLICY IF EXISTS "Users can insert own stories" ON work_stories;
DROP POLICY IF EXISTS "Users can update own stories" ON work_stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON work_stories;
DROP POLICY IF EXISTS "Anyone can view published stories via share link" ON work_stories;

DROP POLICY IF EXISTS "Users can view own share link" ON share_links;
DROP POLICY IF EXISTS "Users can insert own share link" ON share_links;
DROP POLICY IF EXISTS "Users can update own share link" ON share_links;
DROP POLICY IF EXISTS "Anyone can view active share links by token" ON share_links;

-- Drop helper functions from migration 003
DROP FUNCTION IF EXISTS has_active_share_link(uuid);
DROP FUNCTION IF EXISTS get_user_id_from_auth();

-- Drop index
DROP INDEX IF EXISTS users_auth_id_idx;

-- Now drop the column
ALTER TABLE users DROP COLUMN IF EXISTS auth_id;

-- Recreate simple policies using id = auth.uid()

-- Users policies
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own record"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view user profile via share link"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM share_links
      WHERE share_links.user_id = users.id
      AND share_links.is_active = true
    )
  );

-- Work stories policies (user_id references users.id which = auth.uid())
CREATE POLICY "Users can view own stories"
  ON work_stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stories"
  ON work_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON work_stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON work_stories FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published stories via share link"
  ON work_stories FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM share_links
      WHERE share_links.user_id = work_stories.user_id
      AND share_links.is_active = true
    )
  );

-- Share links policies
CREATE POLICY "Users can view own share link"
  ON share_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own share link"
  ON share_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own share link"
  ON share_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active share links by token"
  ON share_links FOR SELECT
  USING (is_active = true);

-- Re-enable RLS (in case it was disabled for debugging)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
