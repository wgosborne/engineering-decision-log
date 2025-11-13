-- ============================================================================
-- DIAGNOSTIC QUERIES FOR SEARCH VECTOR ISSUES
-- ============================================================================
-- Run these queries one by one to diagnose the search problem
-- ============================================================================

-- QUERY 1: Check if search vectors exist (should return 0)
-- ============================================================================
SELECT COUNT(*) as null_search_vectors
FROM decisions
WHERE search_vector IS NULL;

-- QUERY 2: Check if the trigger exists and its definition
-- ============================================================================
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_search_vector'
  AND event_object_table = 'decisions';

-- QUERY 3: Look at actual search vectors for recent decisions
-- ============================================================================
SELECT
    id,
    title,
    date_created,
    date_updated,
    search_vector::text as search_vector_content
FROM decisions
ORDER BY date_created DESC
LIMIT 5;

-- QUERY 4: Test search directly against a known term
-- ============================================================================
-- Replace 'test-term' with a word you KNOW exists in a recent decision's title
SELECT
    id,
    title,
    date_created,
    ts_rank(search_vector, to_tsquery('english', 'architecture')) as rank
FROM decisions
WHERE search_vector @@ to_tsquery('english', 'architecture')
ORDER BY rank DESC
LIMIT 10;

-- QUERY 5: Check what terms are actually IN the search vectors
-- ============================================================================
-- This shows what searchable terms exist in recent decisions
SELECT
    id,
    title,
    date_created,
    ts_stat.word,
    ts_stat.ndoc
FROM (
    SELECT
        id,
        title,
        date_created,
        (ts_stat('SELECT search_vector FROM decisions WHERE id = ''' || id || '''::uuid')).*
    FROM decisions
    ORDER BY date_created DESC
    LIMIT 1
) as ts_stat
LIMIT 20;

-- QUERY 6: Test creating a new decision to see if trigger fires
-- ============================================================================
-- This will create a test decision - check if it becomes searchable
INSERT INTO decisions (
    title,
    business_context,
    problem_statement,
    category
) VALUES (
    'Test Search Decision UNIQUE12345',
    'Testing if search vectors are created automatically',
    'Need to verify the trigger is working',
    'other'
) RETURNING id, title, search_vector::text;

-- QUERY 7: Immediately search for the test decision
-- ============================================================================
-- Run this RIGHT AFTER Query 6
SELECT
    id,
    title,
    date_created
FROM decisions
WHERE search_vector @@ to_tsquery('english', 'UNIQUE12345')
LIMIT 5;

-- QUERY 8: Check specific recent decision by ID
-- ============================================================================
-- Replace 'your-decision-id' with the UUID of a recent decision that's not searchable
-- SELECT
--     id,
--     title,
--     category,
--     project_name,
--     date_created,
--     date_updated,
--     CASE
--         WHEN search_vector IS NULL THEN 'NULL - NO SEARCH VECTOR!'
--         WHEN search_vector = ''::tsvector THEN 'EMPTY SEARCH VECTOR!'
--         ELSE 'Has search vector: ' || to_tsvector('english', COALESCE(title, ''))::text
--     END as search_vector_status
-- FROM decisions
-- WHERE id = 'your-decision-id';

-- QUERY 9: Force update a recent decision to see if trigger fires
-- ============================================================================
-- Get a recent decision ID first
SELECT id, title FROM decisions ORDER BY date_created DESC LIMIT 1;

-- Then update it (replace the UUID below with the ID from above)
-- UPDATE decisions
-- SET notes = 'Updated to test trigger - ' || NOW()::text
-- WHERE id = 'replace-with-actual-uuid'
-- RETURNING id, title, date_updated, search_vector::text;

-- ============================================================================
-- CLEANUP: Delete the test decision after diagnostics
-- ============================================================================
-- Run this after you're done testing
DELETE FROM decisions WHERE title LIKE '%UNIQUE12345%';
