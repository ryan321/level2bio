-- Migration: Input validation constraints
-- Date: 2024-12-02
--
-- Adds database-level validation to prevent bypassing frontend validation
-- These constraints match the frontend limits in src/lib/validation.ts

-- Add length constraints to users table
ALTER TABLE users
  ADD CONSTRAINT users_name_length CHECK (length(name) <= 100 AND length(name) >= 1),
  ADD CONSTRAINT users_headline_length CHECK (headline IS NULL OR length(headline) <= 200),
  ADD CONSTRAINT users_bio_length CHECK (bio IS NULL OR length(bio) <= 2000),
  ADD CONSTRAINT users_email_length CHECK (email IS NULL OR length(email) <= 320);

-- Add length constraints to work_stories table
ALTER TABLE work_stories
  ADD CONSTRAINT stories_title_length CHECK (length(title) <= 200 AND length(title) >= 1);

-- Add length constraints to profiles table
ALTER TABLE profiles
  ADD CONSTRAINT profiles_name_length CHECK (length(name) <= 100 AND length(name) >= 1),
  ADD CONSTRAINT profiles_headline_length CHECK (headline IS NULL OR length(headline) <= 200),
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR length(bio) <= 2000);

-- Validate story responses JSONB (each value max 10000 chars, max 20 fields)
CREATE OR REPLACE FUNCTION validate_story_responses()
RETURNS trigger AS $$
BEGIN
  -- Allow empty/null responses
  IF NEW.responses IS NULL OR NEW.responses = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- Check that no individual response exceeds 10000 chars
  IF EXISTS (
    SELECT 1 FROM jsonb_each_text(NEW.responses)
    WHERE length(value) > 10000
  ) THEN
    RAISE EXCEPTION 'Story response exceeds maximum length of 10000 characters';
  END IF;

  -- Limit total number of response fields to 20
  IF (SELECT count(*) FROM jsonb_object_keys(NEW.responses)) > 20 THEN
    RAISE EXCEPTION 'Too many response fields (max 20)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_responses_trigger
  BEFORE INSERT OR UPDATE ON work_stories
  FOR EACH ROW EXECUTE FUNCTION validate_story_responses();

-- Validate story assets JSONB array (max 50 assets)
CREATE OR REPLACE FUNCTION validate_story_assets()
RETURNS trigger AS $$
BEGIN
  -- Allow null assets
  IF NEW.assets IS NULL THEN
    RETURN NEW;
  END IF;

  IF jsonb_array_length(NEW.assets) > 50 THEN
    RAISE EXCEPTION 'Too many assets (max 50)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_assets_trigger
  BEFORE INSERT OR UPDATE ON work_stories
  FOR EACH ROW EXECUTE FUNCTION validate_story_assets();

-- Limit stories per user (max 500)
CREATE OR REPLACE FUNCTION check_user_story_limit()
RETURNS trigger AS $$
BEGIN
  IF (SELECT COUNT(*) FROM work_stories WHERE user_id = NEW.user_id) >= 500 THEN
    RAISE EXCEPTION 'Maximum 500 stories allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_story_limit
  BEFORE INSERT ON work_stories
  FOR EACH ROW EXECUTE FUNCTION check_user_story_limit();

-- Limit profiles per user (max 50)
CREATE OR REPLACE FUNCTION check_user_profile_limit()
RETURNS trigger AS $$
BEGIN
  IF (SELECT COUNT(*) FROM profiles WHERE user_id = NEW.user_id) >= 50 THEN
    RAISE EXCEPTION 'Maximum 50 profiles allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_profile_limit
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_user_profile_limit();

-- Limit stories per profile (max 100)
CREATE OR REPLACE FUNCTION check_profile_story_limit()
RETURNS trigger AS $$
BEGIN
  IF (SELECT COUNT(*) FROM profile_stories WHERE profile_id = NEW.profile_id) >= 100 THEN
    RAISE EXCEPTION 'Maximum 100 stories allowed per profile';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_profile_story_limit
  BEFORE INSERT ON profile_stories
  FOR EACH ROW EXECUTE FUNCTION check_profile_story_limit();
