-- ============================================================================
-- TEST: Verify "have" is a stop word
-- ============================================================================

-- Query 1: Check if "have" is in the English stop word list
SELECT * FROM pg_catalog.ts_debug('english', 'have');

-- Query 2: See what happens when you search for "have"
SELECT to_tsquery('english', 'have');
-- If this returns an empty tsquery, "have" is being filtered out

-- Query 3: Search for "have" using plainto_tsquery (what the app uses)
SELECT plainto_tsquery('english', 'have');
-- Should also return empty or filtered result

-- Query 4: Test with a unique word from your decision
-- Replace 'unique-word' with an actual uncommon word from your recent decision
SELECT id, title
FROM decisions
WHERE search_vector @@ plainto_tsquery('english', 'unique-word');

-- Query 5: Show all English stop words
SELECT * FROM pg_catalog.ts_token_type('english');

-- ============================================================================
-- WORKAROUND: Search for less common words
-- ============================================================================
-- Instead of searching for "have", search for:
-- - Specific nouns (e.g., "database", "authentication")
-- - Specific verbs (e.g., "implement", "refactor")
-- - Domain-specific terms (e.g., "postgres", "react", "deployment")
--
-- Common stop words that WON'T work in search:
-- a, an, and, are, as, at, be, but, by, for, have, in, is, it, of, on, or,
-- that, the, to, was, will, with
-- ============================================================================
