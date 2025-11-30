-- Migration: Create storage buckets for story assets
-- Supports videos, images, and PDFs

-- =============================================================================
-- 1. CREATE STORAGE BUCKETS
-- =============================================================================

-- Story assets bucket (videos, images, PDFs attached to stories)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-assets',
  'story-assets',
  true,  -- Public bucket for easy sharing via profile links
  52428800,  -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. STORAGE RLS POLICIES
-- =============================================================================

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload their own assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'story-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can update their own assets
CREATE POLICY "Users can update their own assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'story-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own assets
CREATE POLICY "Users can delete their own assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'story-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Anyone can view assets (public bucket)
CREATE POLICY "Anyone can view story assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'story-assets');

-- =============================================================================
-- 3. ADD ASSETS COLUMN TO WORK_STORIES
-- =============================================================================

-- Add assets JSON column to store file metadata
-- Structure: [{ id, name, type, size, url, mimeType }]
ALTER TABLE work_stories
ADD COLUMN IF NOT EXISTS assets jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN work_stories.assets IS 'Array of uploaded assets: [{id, name, type, size, url, mimeType}]';
