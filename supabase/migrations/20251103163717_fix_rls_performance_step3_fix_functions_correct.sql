/*
  # Fix RLS Performance Issues - Step 3: Fix Function Search Path

  Remove role mutable search_path and set immutable search_path for deterministic behavior.
  This improves performance by avoiding re-evaluation of search_path for each query.
*/

-- Drop user-created triggers first
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;

-- Drop the old function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate with immutable search_path
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at
BEFORE UPDATE ON files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- For create_profile_for_user, we cannot modify the signature since it's used by
-- Supabase's auth.users trigger. We'll alter it to have immutable search_path.
ALTER FUNCTION create_profile_for_user()
SET search_path = public;
