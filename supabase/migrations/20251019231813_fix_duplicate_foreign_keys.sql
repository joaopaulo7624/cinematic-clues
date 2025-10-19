/*
  # Fix Duplicate Foreign Keys

  ## Problem
  The posts table has 3 duplicate foreign key constraints pointing to profiles table:
  - posts_user_id_fkey
  - posts_user_id_fkey_profiles
  - posts_user_id_fkey_to_profiles
  
  This causes Supabase PostgREST to fail with error PGRST201 when trying to embed profiles data.

  ## Solution
  1. Drop all duplicate foreign key constraints
  2. Recreate a single, properly named foreign key constraint
  3. Do the same for replies table which has similar issue

  ## Changes
  - Remove duplicate foreign keys from posts table
  - Remove duplicate foreign keys from replies table
  - Add single foreign key constraint for each table
*/

-- Fix posts table foreign keys
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'posts_user_id_fkey_profiles'
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey_profiles;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'posts_user_id_fkey_to_profiles'
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey_to_profiles;
  END IF;
END $$;

-- Ensure we have exactly one foreign key for posts.user_id -> profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'posts_user_id_fkey'
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts 
      ADD CONSTRAINT posts_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES profiles(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Fix replies table foreign keys
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'replies_user_id_fkey_profiles'
    AND table_name = 'replies'
  ) THEN
    ALTER TABLE replies DROP CONSTRAINT replies_user_id_fkey_profiles;
  END IF;
END $$;

-- Ensure we have exactly one foreign key for replies.user_id -> profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'replies_user_id_fkey'
    AND table_name = 'replies'
  ) THEN
    ALTER TABLE replies 
      ADD CONSTRAINT replies_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES profiles(id) 
      ON DELETE CASCADE;
  END IF;
END $$;