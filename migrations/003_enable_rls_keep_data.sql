-- ============================================================================
-- MIGRATION: Enable RLS and Preserve Existing Data
-- ============================================================================
-- Purpose: Set up auth with RLS while keeping your existing decisions
-- Run this AFTER creating your user account
-- Date: 2025-01-12
-- ============================================================================

-- Step 1: Fix the foreign key constraint
-- ============================================================================
ALTER TABLE decisions DROP CONSTRAINT IF EXISTS decisions_user_id_fkey;

-- Step 2: Add user_id column if it doesn't exist
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'decisions'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE decisions ADD COLUMN user_id UUID;
    END IF;
END $$;

-- Step 3: Create correct foreign key to auth.users
-- ============================================================================
ALTER TABLE decisions
ADD CONSTRAINT decisions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- ============================================================================
-- STOP HERE! Before proceeding:
-- ============================================================================
-- 1. Go to your Supabase Dashboard → Authentication → Users
-- 2. Find your user account you just created
-- 3. Copy the "UID" (User ID) - it looks like: 363b1e12-dc80-4fe6-9b39-f1da73bd720d
-- 4. Replace 'YOUR-USER-ID-HERE' in the command below with your actual UID
-- 5. Then run the rest of this migration
-- ============================================================================

-- Step 4: Assign all existing decisions to your user account
-- ============================================================================
-- IMPORTANT: Replace 'YOUR-USER-ID-HERE' with your actual User UID!

UPDATE decisions
SET user_id = 'YOUR-USER-ID-HERE'
WHERE user_id IS NULL;

-- Step 5: Verify the update worked
-- ============================================================================
-- This should return 0 (no decisions without a user_id)
SELECT COUNT(*) as decisions_without_user
FROM decisions
WHERE user_id IS NULL;

-- This should show your decision count
SELECT COUNT(*) as your_decisions
FROM decisions
WHERE user_id = 'YOUR-USER-ID-HERE';  -- Replace with your UID

-- Step 6: Make user_id required (now that all data is assigned)
-- ============================================================================
ALTER TABLE decisions
ALTER COLUMN user_id SET NOT NULL;

-- Step 7: Create index for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS decisions_user_id_idx ON decisions(user_id);

-- Step 8: Enable Row Level Security
-- ============================================================================
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Step 9: Drop any existing policies (clean slate)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can insert their own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can update their own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can delete their own decisions" ON decisions;

-- Step 10: Create RLS Policies
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
-- VERIFICATION
-- ============================================================================

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'decisions';
-- Should show: rowsecurity = true

-- View all policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'decisions';
-- Should show 4 policies

-- Check foreign key
SELECT
    tc.constraint_name,
    ccu.table_schema AS foreign_schema,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'decisions'
    AND tc.constraint_name = 'decisions_user_id_fkey';
-- Should show: foreign_schema = 'auth', foreign_table = 'users'

-- ============================================================================
-- SUCCESS! Your data is preserved and secured with RLS
-- ============================================================================
