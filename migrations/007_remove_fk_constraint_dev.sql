-- ============================================================================
-- DEV DATABASE: Remove Foreign Key Constraint
-- ============================================================================
-- Purpose: Remove the user_id foreign key constraint for dev database
-- The constraint requires user_id to exist in auth.users, but we're using
-- a fake public user ID that doesn't exist there.
-- Run this in: Supabase SQL Editor for your DEV database only
-- ============================================================================

-- Step 1: Find and drop the foreign key constraint
-- ============================================================================
-- First, let's see what constraints exist
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'decisions'
    AND con.contype = 'f'  -- 'f' = foreign key
    AND con.conname LIKE '%user_id%';

-- Drop the foreign key constraint
-- The constraint is usually named "decisions_user_id_fkey"
ALTER TABLE decisions DROP CONSTRAINT IF EXISTS decisions_user_id_fkey;

-- Step 2: Verify the constraint is gone
-- ============================================================================
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'decisions'
    AND con.contype = 'f'
    AND con.conname LIKE '%user_id%';
-- Should return no rows

-- Step 3: Verify you can now insert decisions
-- ============================================================================
-- This should work now without the foreign key constraint
SELECT user_id, COUNT(*) FROM decisions GROUP BY user_id;

-- ============================================================================
-- Notes
-- ============================================================================
-- The user_id column still exists and will still have the default value,
-- but it no longer requires the user to exist in auth.users.
-- This is perfect for dev where we use a fake public user ID.
