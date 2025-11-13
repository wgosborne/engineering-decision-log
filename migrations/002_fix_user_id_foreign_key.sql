-- ============================================================================
-- MIGRATION: Fix user_id Foreign Key Constraint
-- ============================================================================
-- Purpose: Fix foreign key to reference auth.users instead of public.users
-- Run this in: Supabase SQL Editor
-- Date: 2025-01-12
-- ============================================================================

-- Step 1: Drop the incorrect foreign key constraint (if it exists)
-- ============================================================================
ALTER TABLE decisions
DROP CONSTRAINT IF EXISTS decisions_user_id_fkey;

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

-- Step 3: Create the CORRECT foreign key constraint
-- ============================================================================
-- This references auth.users (where Supabase stores user accounts)
ALTER TABLE decisions
ADD CONSTRAINT decisions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Step 4: Handle existing decisions
-- ============================================================================
-- OPTION A: Delete all existing test decisions (recommended for fresh start)
DELETE FROM decisions WHERE user_id IS NULL;

-- OPTION B: If you want to keep existing decisions, first create a user account,
-- then get your user ID from Supabase dashboard (Authentication → Users)
-- and run this (replace with your actual user ID):
-- UPDATE decisions SET user_id = 'your-user-id-here' WHERE user_id IS NULL;

-- Step 5: Make user_id required
-- ============================================================================
ALTER TABLE decisions
ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Create index for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS decisions_user_id_idx ON decisions(user_id);

-- Step 7: Enable Row Level Security
-- ============================================================================
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies (in case they were partially created)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can insert their own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can update their own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can delete their own decisions" ON decisions;

-- Step 9: Create RLS Policies
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
-- Run these to verify everything is working:

-- 1. Check if RLS is enabled:
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'decisions';
-- Should return: rowsecurity = true

-- 2. View all policies:
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'decisions';
-- Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- 3. Check the foreign key constraint:
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'decisions'
    AND kcu.column_name = 'user_id';
-- Should show: foreign_table_schema = 'auth', foreign_table_name = 'users'

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- If all verification queries pass, you're done!
-- Now test by creating a user account and logging in.
