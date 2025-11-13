-- ============================================================================
-- TEMPORARY: Disable RLS
-- ============================================================================
-- This temporarily disables RLS so you can see your data
-- We'll re-enable it after properly refactoring the service layer
-- ============================================================================

ALTER TABLE decisions DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'decisions';
-- Should show: rowsecurity = false
