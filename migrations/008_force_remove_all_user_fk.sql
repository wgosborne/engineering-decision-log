-- ============================================================================
-- DEV DATABASE: Force Remove ALL Foreign Key Constraints on user_id
-- ============================================================================
-- Purpose: Thoroughly remove any foreign key constraints on user_id
-- Run this in: Supabase SQL Editor for your DEV database
-- ============================================================================

-- Step 1: List ALL constraints on decisions table
-- ============================================================================
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 't' THEN 'TRIGGER'
        WHEN 'x' THEN 'EXCLUSION'
    END AS constraint_type_desc,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'decisions';

-- Step 2: Drop ALL known foreign key constraints related to user_id
-- ============================================================================
ALTER TABLE decisions DROP CONSTRAINT IF EXISTS decisions_user_id_fkey CASCADE;
ALTER TABLE decisions DROP CONSTRAINT IF EXISTS decisions_user_id_fkey1 CASCADE;
ALTER TABLE decisions DROP CONSTRAINT IF EXISTS fk_decisions_user_id CASCADE;
ALTER TABLE decisions DROP CONSTRAINT IF EXISTS fk_user_id CASCADE;

-- Step 3: Find any remaining foreign key constraints dynamically
-- ============================================================================
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'decisions'
          AND con.contype = 'f'
          AND pg_get_constraintdef(con.oid) LIKE '%user_id%'
    LOOP
        EXECUTE 'ALTER TABLE decisions DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.conname) || ' CASCADE';
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Step 4: Verify all foreign keys are gone
-- ============================================================================
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'decisions'
    AND con.contype = 'f';
-- Should return no rows (or at least none related to user_id)

-- Step 5: Test insert with public user_id
-- ============================================================================
-- This should now work
INSERT INTO decisions (
    title,
    business_context,
    problem_statement,
    category,
    user_id
) VALUES (
    'Test Decision',
    'Testing foreign key removal',
    'Verify we can insert with public user_id',
    'other',
    '00000000-0000-0000-0000-000000000000'::uuid
) RETURNING id, title, user_id;

-- If the above worked, delete the test record
DELETE FROM decisions WHERE title = 'Test Decision' AND business_context = 'Testing foreign key removal';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Foreign key constraints successfully removed!' AS status;
