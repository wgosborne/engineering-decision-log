-- ============================================================================
-- MIGRATION: Fix Stop Words in Full-Text Search
-- ============================================================================
-- Date: 2025-11-13
-- Purpose: Switch from 'english' to 'simple' text search configuration
--          to allow searching for common words (have, the, is, etc.)
--
-- Issue: PostgreSQL's 'english' config filters out stop words like "have",
--        "the", "is", "and", etc., making them unsearchable. This is
--        problematic for personal decision logs where any word should be
--        searchable.
--
-- Solution: Switch to 'simple' config which doesn't filter stop words.
--
-- Trade-offs:
-- ✅ Pros: All words become searchable (including "have", "the", etc.)
-- ⚠️  Cons: Slightly larger index size, no stemming (e.g., "running" != "run")
--
-- Safety: This migration can be run multiple times safely (idempotent).
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Update the search vector function to use 'simple' config
-- ============================================================================
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.business_context, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.problem_statement, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.reasoning, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.chosen_option, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(NEW.notes, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Step 2: Reindex all existing decisions with new 'simple' config
-- ============================================================================
UPDATE decisions
SET search_vector =
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(business_context, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(problem_statement, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(reasoning, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(chosen_option, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(notes, '')), 'D');

-- ============================================================================
-- Step 3: Verify the fix
-- ============================================================================
DO $$
DECLARE
    null_count INTEGER;
    total_count INTEGER;
    test_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM decisions WHERE search_vector IS NULL;
    SELECT COUNT(*) INTO total_count FROM decisions;

    -- Test if "have" is now searchable
    SELECT COUNT(*) INTO test_result
    FROM decisions
    WHERE search_vector @@ plainto_tsquery('simple', 'have');

    RAISE NOTICE '============================================';
    RAISE NOTICE 'Stop Words Migration Complete';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total decisions: %', total_count;
    RAISE NOTICE 'Decisions with NULL search_vector: %', null_count;
    RAISE NOTICE 'Decisions containing "have": %', test_result;

    IF null_count > 0 THEN
        RAISE WARNING 'Found % decisions with NULL search_vector!', null_count;
    ELSE
        RAISE NOTICE 'All search vectors updated successfully!';
    END IF;

    IF test_result > 0 THEN
        RAISE NOTICE 'Stop word search is now working!';
    ELSE
        RAISE NOTICE 'No decisions contain "have" - try searching for other words';
    END IF;
    RAISE NOTICE '============================================';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run separately after migration)
-- ============================================================================
-- Uncomment these to manually verify the migration:

-- 1. Test searching for stop words
-- SELECT id, title
-- FROM decisions
-- WHERE search_vector @@ plainto_tsquery('simple', 'have')
-- LIMIT 5;

-- 2. Test other common stop words
-- SELECT id, title
-- FROM decisions
-- WHERE search_vector @@ plainto_tsquery('simple', 'the')
-- LIMIT 5;

-- 3. Compare 'english' vs 'simple' config for a query
-- SELECT plainto_tsquery('english', 'have') as english_query,
--        plainto_tsquery('simple', 'have') as simple_query;

-- Expected result:
-- english_query: '' (empty - filtered out)
-- simple_query: 'have' (included)

-- ============================================================================
