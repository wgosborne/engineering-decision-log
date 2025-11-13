-- ============================================================================
-- MIGRATION: Fix Search Vector Trigger
-- ============================================================================
-- Date: 2025-11-12
-- Purpose: Fix the search vector trigger to fire on ANY column update
--          instead of only specific columns, preventing stale search vectors
--
-- Issue: The original trigger only fired when 6 specific fields were updated.
--        When other fields (category, tags, project, outcome, etc.) were
--        updated, the search vector became stale, causing search to fail.
--
-- Solution: Remove the column list from the trigger so it fires on any update.
--
-- Safety: This migration can be run multiple times safely (idempotent).
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Drop the old trigger
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_update_search_vector ON decisions;

-- ============================================================================
-- Step 2: Create the fixed trigger (fires on ANY column update)
-- ============================================================================
CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE
    ON decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- ============================================================================
-- Step 3: Reindex all existing decisions to fix stale search vectors
-- ============================================================================
UPDATE decisions
SET search_vector =
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(business_context, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(problem_statement, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(reasoning, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(chosen_option, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(notes, '')), 'D');

-- ============================================================================
-- Step 4: Verify the fix
-- ============================================================================
-- Check for NULL search vectors (should be 0)
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM decisions WHERE search_vector IS NULL;
    SELECT COUNT(*) INTO total_count FROM decisions;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'Search Vector Migration Complete';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total decisions: %', total_count;
    RAISE NOTICE 'Decisions with NULL search_vector: %', null_count;

    IF null_count > 0 THEN
        RAISE WARNING 'Found % decisions with NULL search_vector!', null_count;
    ELSE
        RAISE NOTICE 'All search vectors updated successfully!';
    END IF;
    RAISE NOTICE '============================================';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run separately after migration)
-- ============================================================================
-- Uncomment these to manually verify the migration:

-- 1. Check trigger definition
-- SELECT * FROM information_schema.triggers
-- WHERE trigger_name = 'trigger_update_search_vector';

-- 2. Test search functionality
-- SELECT id, title, ts_rank(search_vector, to_tsquery('english', 'test')) AS rank
-- FROM decisions
-- WHERE search_vector @@ to_tsquery('english', 'test')
-- ORDER BY rank DESC
-- LIMIT 10;

-- 3. Check for NULL search vectors
-- SELECT COUNT(*) FROM decisions WHERE search_vector IS NULL;

-- ============================================================================
