-- ============================================================================
-- SAFE MIGRATION: Update Decision Categories with Data Preservation
-- ============================================================================
-- Purpose: Remove hiring, team-structure, vendor categories and add searching, ui
-- Date: 2025-11-12
--
-- This version automatically migrates existing data:
-- - 'hiring' -> 'other'
-- - 'team-structure' -> 'other'
-- - 'vendor' -> 'other'
--
-- SAFER than migration_update_categories.sql - handles existing data automatically
-- ============================================================================

BEGIN;

-- Step 1: Check what data we have (for logging purposes)
DO $$
DECLARE
    hiring_count INTEGER;
    team_structure_count INTEGER;
    vendor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO hiring_count FROM decisions WHERE category = 'hiring';
    SELECT COUNT(*) INTO team_structure_count FROM decisions WHERE category = 'team-structure';
    SELECT COUNT(*) INTO vendor_count FROM decisions WHERE category = 'vendor';

    RAISE NOTICE 'Found % decisions with category "hiring"', hiring_count;
    RAISE NOTICE 'Found % decisions with category "team-structure"', team_structure_count;
    RAISE NOTICE 'Found % decisions with category "vendor"', vendor_count;
    RAISE NOTICE 'These will be migrated to "other" category';
END $$;

-- Step 2: Migrate existing data from removed categories to 'other'
UPDATE decisions
SET category = 'other'::text::decision_category
WHERE category IN ('hiring', 'team-structure', 'vendor');

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
ALTER TABLE decisions
    ALTER COLUMN category TYPE decision_category
    USING category::text::decision_category;

-- Step 6: Drop the old enum type
DROP TYPE decision_category_old;

-- Step 7: Verify the migration
RAISE NOTICE 'Migration complete! Current category distribution:';
SELECT
    category,
    COUNT(*) as count
FROM decisions
GROUP BY category
ORDER BY count DESC;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- Migration completed successfully!
-- - Removed categories: hiring, team-structure, vendor
-- - Added categories: searching, ui
-- - Existing decisions with removed categories have been moved to 'other'
-- ============================================================================

-- ============================================================================
-- POST-MIGRATION CHECKLIST
-- ============================================================================
-- [ ] Restart your application
-- [ ] Clear any Redis/cache if applicable
-- [ ] Verify category dropdowns show correct options
-- [ ] Test creating a new decision with 'searching' or 'ui' category
-- [ ] Update any documentation referencing old categories
-- ============================================================================
