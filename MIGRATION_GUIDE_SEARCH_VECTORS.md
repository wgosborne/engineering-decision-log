# Database Migration Guide: Fix Search Vector Trigger

## Overview
This migration fixes a critical bug in the full-text search functionality where search vectors were not being updated when most fields were modified, causing search to return stale or missing results for edited decisions.

**The Problem:**
- The search vector trigger only fired when 6 specific fields were updated: `title`, `business_context`, `problem_statement`, `reasoning`, `chosen_option`, `notes`
- When other fields were updated (`category`, `tags`, `project_name`, `outcome`, `confidence_level`, etc.), the search vector became stale
- Newer decisions that were edited post-creation became unfindable via search

**The Solution:**
- Update the trigger to fire on ANY column update
- Reindex all existing decisions to fix stale search vectors

## Migration Script

Only one migration script is needed:

### `migration_fix_search_vectors.sql`

**What it does:**
1. Drops the old trigger definition
2. Creates the fixed trigger (fires on ANY update)
3. Reindexes all existing decisions to fix stale search vectors
4. Verifies the migration succeeded

**Safety:**
- Uses a transaction (BEGIN/COMMIT) for safety
- Idempotent - can be run multiple times safely
- No data loss risk - only updates search metadata

## How to Run the Migration

### Option A: Using Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `migration_fix_search_vectors.sql`
4. Copy and paste the contents
5. Click **Run**
6. Check the output for success messages

### Option B: Using psql (Command Line)

1. **Connect to your database:**
   ```bash
   psql -h your-database-host -U your-username -d your-database-name
   ```

2. **Run the migration:**
   ```bash
   \i migration_fix_search_vectors.sql
   ```

3. **Check the output:**
   - Should show "All search vectors updated successfully!"
   - If warnings appear, see Troubleshooting section

### Option C: Using Database GUI (e.g., pgAdmin, TablePlus)

1. Open your database connection
2. Open the query editor
3. Load `migration_fix_search_vectors.sql`
4. Execute the script
5. Review the output in the Messages tab

## Pre-Migration Checklist

Before running the migration:

- [ ] **Backup your database** (recommended, though this is a low-risk migration)
- [ ] Check how many decisions will be reindexed:
  ```sql
  SELECT COUNT(*) FROM decisions;
  ```
- [ ] Optional: Check current trigger definition:
  ```sql
  SELECT * FROM information_schema.triggers
  WHERE trigger_name = 'trigger_update_search_vector';
  ```
- [ ] Optional: Stop your application (not required, but recommended)

## Post-Migration Checklist

After running the migration:

- [ ] Verify the migration succeeded (check the output messages)
- [ ] Test search functionality:
  ```sql
  -- Replace 'test-term' with a word from your decisions
  SELECT id, title
  FROM decisions
  WHERE search_vector @@ to_tsquery('english', 'test-term')
  LIMIT 5;
  ```
- [ ] Verify no NULL search vectors exist:
  ```sql
  SELECT COUNT(*) FROM decisions WHERE search_vector IS NULL;
  -- Should return 0
  ```
- [ ] Restart your application (if stopped)
- [ ] Clear any caches (Redis, application cache, etc.)
- [ ] Test search in the UI:
  - Search for a term you know exists in newer decisions
  - Verify results appear correctly
  - Try searching for category names, project names, etc.

## Expected Results

After migration, you should see:

1. **Immediate improvements:**
   - Search returns results for newer decisions
   - Search includes matches from all fields (category, tags, project, etc.)
   - No more "missing" decisions in search results

2. **Ongoing benefits:**
   - Future edits to ANY field will keep search vectors current
   - No more stale search results
   - Consistent search behavior across all decisions

## Troubleshooting

### Migration Runs But Shows Warnings

**Symptom:** "Found X decisions with NULL search_vector!"

**Cause:** Some decisions have completely NULL content fields

**Solution:**
```sql
-- Check which decisions have issues
SELECT id, title FROM decisions WHERE search_vector IS NULL;

-- Manual fix (if needed)
UPDATE decisions
SET title = COALESCE(title, 'Untitled')
WHERE search_vector IS NULL;

-- Re-run migration
\i migration_fix_search_vectors.sql
```

### Search Still Not Working After Migration

**Possible causes:**

1. **Application cache:** Clear your browser cache and application cache
2. **Old database connection:** Restart your application to pick up the new trigger
3. **Check the search query:**
   ```sql
   -- Test directly in database
   SELECT id, title,
          ts_rank(search_vector, to_tsquery('english', 'your-search-term')) as rank
   FROM decisions
   WHERE search_vector @@ to_tsquery('english', 'your-search-term')
   ORDER BY rank DESC;
   ```

### Migration Times Out

**Cause:** Large number of decisions to reindex

**Solution:**
1. Increase timeout:
   ```sql
   SET statement_timeout = '300s';  -- 5 minutes
   ```
2. Run during off-peak hours
3. If still failing, contact support

### Need to Rollback

If something goes wrong:

1. **During migration:** Run `ROLLBACK;` in the same session
2. **After migration:** Restore the old trigger:
   ```sql
   DROP TRIGGER IF EXISTS trigger_update_search_vector ON decisions;

   CREATE TRIGGER trigger_update_search_vector
       BEFORE INSERT OR UPDATE OF title, business_context, problem_statement, reasoning, chosen_option, notes
       ON decisions
       FOR EACH ROW
       EXECUTE FUNCTION update_search_vector();
   ```

## Verification Queries

After migration, run these to verify everything works:

### 1. Check Trigger Definition
```sql
SELECT event_object_table, trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_search_vector';
```

Expected: Should show "BEFORE INSERT OR UPDATE" (without the "OF column_list" part)

### 2. Test Search Functionality
```sql
-- Test basic search (replace 'architecture' with your search term)
SELECT id, title,
       ts_rank(search_vector, to_tsquery('english', 'architecture')) as rank
FROM decisions
WHERE search_vector @@ to_tsquery('english', 'architecture')
ORDER BY rank DESC
LIMIT 10;
```

### 3. Verify No NULL Vectors
```sql
SELECT COUNT(*) as null_count FROM decisions WHERE search_vector IS NULL;
-- Should be 0
```

### 4. Test That Updates Trigger Reindexing
```sql
-- Find a decision ID
SELECT id, title FROM decisions LIMIT 1;

-- Update a non-searchable field (like category)
UPDATE decisions
SET category = 'architecture'
WHERE id = 'your-decision-id-here';

-- Verify search_vector was updated (date_updated should change)
SELECT id, title, date_updated FROM decisions WHERE id = 'your-decision-id-here';
```

## Performance Impact

**Migration time:**
- ~0.1 seconds per 100 decisions
- Most databases will complete in under 1 second

**Ongoing performance:**
- Negligible - the trigger function is very fast
- No impact on read queries
- Minimal impact on write queries (already had a trigger)

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify you have database admin privileges
3. Ensure no other sessions are blocking the `decisions` table
4. Review the verification queries above
5. Check your application logs for search-related errors

## Related Files

- **Migration script:** `migration_fix_search_vectors.sql`
- **Updated schema:** `schema.sql` (lines 178-184)
- **Search implementation:** `lib/api/decisions-service.ts` (lines 175-181)
