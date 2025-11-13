-- ============================================================================
-- DEV BRANCH ONLY: Enable Public Access
-- ============================================================================
-- Purpose: Disable RLS and create a public user for the dev branch
-- Run this in: Supabase SQL Editor for your DEV database only
-- Date: 2025-01-13
-- WARNING: DO NOT run this on production/main database!
-- ============================================================================

-- Step 1: Disable Row Level Security
-- ============================================================================
ALTER TABLE decisions DISABLE ROW LEVEL SECURITY;

-- Step 2: Ensure the public user exists in auth.users
-- ============================================================================
-- Note: This creates a special user that will be used for all public decisions
-- The UUID '00000000-0000-0000-0000-000000000000' is used as a placeholder
-- If you already have decisions with different user_ids, you can either:
-- 1. Keep them (they'll still be visible)
-- 2. Update them to use the public user_id

-- We don't actually need to insert into auth.users since we're disabling RLS
-- Just make sure your code uses user_id: '00000000-0000-0000-0000-000000000000'

-- Step 3: Make user_id nullable (optional, for flexibility)
-- ============================================================================
-- Uncomment if you want to allow decisions without a user_id
-- ALTER TABLE decisions ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Set default value for user_id (optional)
-- ============================================================================
-- This automatically assigns the public user_id to new decisions
ALTER TABLE decisions ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the changes worked:

-- 1. Check if RLS is disabled:
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'decisions';
-- Should show: rowsecurity = false

-- 2. View all decisions (should work without auth):
SELECT id, title, category, date_created FROM decisions ORDER BY date_created DESC LIMIT 10;

-- 3. Check the user_id column configuration:
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'decisions' AND column_name = 'user_id';

-- ============================================================================
-- ROLLBACK (if needed to restore auth)
-- ============================================================================
-- To revert back to authenticated mode:
-- ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE decisions ALTER COLUMN user_id DROP DEFAULT;
