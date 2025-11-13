-- ============================================================================
-- MIGRATION: Update Decision Categories
-- ============================================================================
-- Purpose: Remove hiring, team-structure, vendor categories and add searching, ui
-- Date: 2025-11-12
--
-- IMPORTANT: Review this script before running!
-- - If you have existing decisions with removed categories, update them first
-- - This migration is irreversible without a backup
-- ============================================================================

-- Step 1: Check if any decisions use the categories we're removing
-- Uncomment to run this check before migration:
-- SELECT category, COUNT(*) as count
-- FROM decisions
-- WHERE category IN ('hiring', 'team-structure', 'vendor')
-- GROUP BY category;

-- Step 2: (OPTIONAL) Update existing decisions to new categories
-- Uncomment and modify as needed if you have data with removed categories:
-- UPDATE decisions SET category = 'other' WHERE category = 'hiring';
-- UPDATE decisions SET category = 'other' WHERE category = 'team-structure';
-- UPDATE decisions SET category = 'other' WHERE category = 'vendor';

-- ============================================================================
-- MAIN MIGRATION
-- ============================================================================

BEGIN;

-- Step 3: Rename the old enum type
ALTER TYPE decision_category RENAME TO decision_category_old;

-- Step 4: Create the new enum type with updated values
CREATE TYPE decision_category AS ENUM (
    'architecture',
    'data-storage',
    'tool-selection',
    'process',
    'project-management',
    'strategic',
    'technical-debt',
    'performance',
    'security',
    'searching',
    'ui',
    'other'
);

-- Step 5: Convert the column to use the new enum type
-- This will fail if any existing data has 'hiring', 'team-structure', or 'vendor'
ALTER TABLE decisions
    ALTER COLUMN category TYPE decision_category
    USING category::text::decision_category;

-- Step 6: Drop the old enum type
DROP TYPE decision_category_old;

-- Step 7: Verify the migration
SELECT
    category,
    COUNT(*) as count
FROM decisions
GROUP BY category
ORDER BY count DESC;

COMMIT;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- If something goes wrong, you can rollback using:
-- ROLLBACK;
--
-- To fully restore, you'll need to:
-- 1. Restore from backup, or
-- 2. Manually recreate the old enum with the original values
-- ============================================================================

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- After running this migration:
-- 1. Restart your application to clear any cached enum values
-- 2. Update any seed data or test fixtures
-- 3. Verify dropdowns and forms show the correct categories
-- ============================================================================
