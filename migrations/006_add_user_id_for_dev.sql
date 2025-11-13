-- ============================================================================
-- DEV DATABASE: Add user_id column
-- ============================================================================
-- Purpose: Add user_id column for dev database (combines auth setup with dev config)
-- Run this in: Supabase SQL Editor for your DEV database
-- ============================================================================

-- Step 1: Add user_id column (nullable initially)
-- ============================================================================
ALTER TABLE decisions
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 2: Set default value for new records
-- ============================================================================
ALTER TABLE decisions
ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;

-- Step 3: Update existing records to use public user ID
-- ============================================================================
UPDATE decisions
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE user_id IS NULL;

-- Step 4: Make user_id NOT NULL (optional, recommended)
-- ============================================================================
ALTER TABLE decisions
ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Create index for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS decisions_user_id_idx ON decisions(user_id);

-- Step 6: Ensure RLS is disabled (already in 005, but just to be safe)
-- ============================================================================
ALTER TABLE decisions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'decisions' AND column_name = 'user_id';

-- Check all records have the public user_id
SELECT user_id, COUNT(*) FROM decisions GROUP BY user_id;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'decisions';
