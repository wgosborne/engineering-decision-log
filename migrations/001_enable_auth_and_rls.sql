-- ============================================================================
-- MIGRATION: Enable Authentication and Row Level Security
-- ============================================================================
-- Purpose: Add user_id to decisions table and enable RLS policies
-- Run this in: Supabase SQL Editor
-- Date: 2025-01-12
-- ============================================================================

-- Step 1: Add user_id column to decisions table
-- ============================================================================
ALTER TABLE decisions
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set user_id for existing decisions to the first user (if any exist)
-- You'll need to manually update this or delete existing test data
-- OPTION 1: Delete all existing decisions (recommended for fresh start)
-- DELETE FROM decisions;

-- OPTION 2: Set to a specific user ID (get from auth.users table)
-- UPDATE decisions SET user_id = 'your-user-id-here' WHERE user_id IS NULL;

-- Step 2: Make user_id NOT NULL after backfilling
-- ============================================================================
-- Uncomment after you've handled existing data:
-- ALTER TABLE decisions ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Create index for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS decisions_user_id_idx ON decisions(user_id);

-- Step 4: Enable Row Level Security
-- ============================================================================
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
-- ============================================================================

-- Policy: Users can view only their own decisions
CREATE POLICY "Users can view their own decisions"
ON decisions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own decisions
CREATE POLICY "Users can insert their own decisions"
ON decisions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own decisions
CREATE POLICY "Users can update their own decisions"
ON decisions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own decisions
CREATE POLICY "Users can delete their own decisions"
ON decisions
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify RLS is working:

-- 1. Check if RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'decisions';

-- 2. View all policies:
-- SELECT * FROM pg_policies WHERE tablename = 'decisions';

-- 3. Test as authenticated user:
-- SELECT * FROM decisions; -- Should only show your decisions

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- DROP POLICY "Users can view their own decisions" ON decisions;
-- DROP POLICY "Users can insert their own decisions" ON decisions;
-- DROP POLICY "Users can update their own decisions" ON decisions;
-- DROP POLICY "Users can delete their own decisions" ON decisions;
-- ALTER TABLE decisions DISABLE ROW LEVEL SECURITY;
-- DROP INDEX IF EXISTS decisions_user_id_idx;
-- ALTER TABLE decisions DROP COLUMN user_id;
