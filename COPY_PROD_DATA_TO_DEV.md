# Copy Production Data to Dev Database

This guide shows you how to copy all your production decisions to your dev database, using the public user ID for all records.

## Prerequisites

**IMPORTANT**: Before importing data, make sure you've added the `user_id` column to your dev database:

```sql
-- Run this in your DEV SQL Editor first!
-- Or run migrations/006_add_user_id_for_dev.sql

ALTER TABLE decisions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE decisions ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
ALTER TABLE decisions DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS decisions_user_id_idx ON decisions(user_id);
```

Once that's done, proceed with one of the methods below:

## Method 1: Export and Import via SQL (Recommended)

### Step 1: Export Data from Production

1. **Go to your PRODUCTION Supabase project**
2. **Open SQL Editor**
3. **Run this query to export as INSERT statements**:

```sql
-- Generate INSERT statements for all decisions
SELECT
    'INSERT INTO decisions (' ||
    'id, date_created, date_updated, title, project_name, category, tags, notes, ' ||
    'business_context, problem_statement, stakeholders, decision_type, ' ||
    'options_considered, chosen_option, reasoning, confidence_level, ' ||
    'tradeoffs_accepted, tradeoffs_rejected, optimized_for, ' ||
    'assumptions, invalidation_conditions, next_review_date, revisit_reason, flagged_for_review, ' ||
    'outcome, outcome_date, outcome_success, lessons_learned, ' ||
    'similar_decision_ids, related_decision_ids, similarity_notes, user_id' ||
    ') VALUES (' ||
    quote_literal(id::text) || '::uuid, ' ||
    quote_literal(date_created::text) || '::timestamptz, ' ||
    quote_literal(date_updated::text) || '::timestamptz, ' ||
    quote_literal(title) || ', ' ||
    COALESCE(quote_literal(project_name), 'NULL') || ', ' ||
    quote_literal(category::text) || '::decision_category, ' ||
    quote_literal(tags::text) || '::text[], ' ||
    COALESCE(quote_literal(notes), 'NULL') || ', ' ||
    quote_literal(business_context) || ', ' ||
    quote_literal(problem_statement) || ', ' ||
    quote_literal(stakeholders::text) || '::text[], ' ||
    COALESCE(quote_literal(decision_type::text) || '::decision_type', 'NULL') || ', ' ||
    quote_literal(options_considered::text) || '::jsonb, ' ||
    COALESCE(quote_literal(chosen_option), 'NULL') || ', ' ||
    COALESCE(quote_literal(reasoning), 'NULL') || ', ' ||
    COALESCE(confidence_level::text, 'NULL') || ', ' ||
    quote_literal(tradeoffs_accepted::text) || '::text[], ' ||
    quote_literal(tradeoffs_rejected::text) || '::text[], ' ||
    quote_literal(optimized_for::text) || '::optimized_for_option[], ' ||
    quote_literal(assumptions::text) || '::text[], ' ||
    quote_literal(invalidation_conditions::text) || '::text[], ' ||
    COALESCE(quote_literal(next_review_date::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(revisit_reason), 'NULL') || ', ' ||
    flagged_for_review || ', ' ||
    COALESCE(quote_literal(outcome), 'NULL') || ', ' ||
    COALESCE(quote_literal(outcome_date::text) || '::timestamptz', 'NULL') || ', ' ||
    COALESCE(outcome_success::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(lessons_learned), 'NULL') || ', ' ||
    quote_literal(similar_decision_ids::text) || '::uuid[], ' ||
    quote_literal(related_decision_ids::text) || '::uuid[], ' ||
    quote_literal(similarity_notes::text) || '::jsonb, ' ||
    '''00000000-0000-0000-0000-000000000000''::uuid' ||
    ');'
FROM decisions
ORDER BY date_created;
```

4. **Copy all the INSERT statements** from the results

### Step 2: Import to Dev Database

1. **Go to your DEV Supabase project**
2. **Open SQL Editor**
3. **Paste all the INSERT statements**
4. **Click Run**

Done! All your production data is now in dev with the public user ID.

---

## Method 2: Simpler Export/Import (Easier but Manual)

### Step 1: Export from Production

**Option A: Use Supabase Studio**
1. Go to your PRODUCTION project
2. Click "Table Editor" → "decisions"
3. Click the download icon (export to CSV)
4. Save the CSV file

**Option B: Use SQL**
```sql
-- In production SQL Editor
COPY (SELECT * FROM decisions ORDER BY date_created) TO STDOUT WITH CSV HEADER;
```
Copy the results and save to a file like `production-decisions.csv`

### Step 2: Clean and Prepare Data

The CSV will have the old user_ids. You have two options:

**Option A: Import then Update (Easiest)**
1. Import the CSV as-is to dev database
2. Then run this SQL to update all user_ids:

```sql
-- Update all decisions to use public user ID
UPDATE decisions
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid;
```

**Option B: Edit CSV Before Import**
1. Open the CSV in Excel or text editor
2. Find the `user_id` column
3. Replace all values with: `00000000-0000-0000-0000-000000000000`
4. Save the CSV

### Step 3: Import to Dev

1. **Go to your DEV project**
2. **Table Editor** → **decisions**
3. **Click Import** (or use SQL below)

**SQL Import from CSV:**
```sql
-- If you have the CSV data, you can use COPY
COPY decisions FROM '/path/to/production-decisions.csv'
WITH (FORMAT CSV, HEADER true);
```

---

## Method 3: Direct Database Connection (Advanced)

If you want to automate this, you can use `pg_dump` and `psql`:

### Step 1: Get Database Connection Strings

**Production Database:**
- Settings → Database → Connection String (Session mode)
- Example: `postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres`

**Dev Database:**
- Same location in your dev project

### Step 2: Export from Production

```bash
# Export just the decisions table data
pg_dump "postgresql://postgres:[prod-password]@db.xxxxx.supabase.co:5432/postgres" \
  --data-only \
  --table=decisions \
  > production-decisions.sql
```

### Step 3: Modify the Export

Open `production-decisions.sql` and replace all user_ids:

```bash
# On Mac/Linux
sed -i "s/'[0-9a-f-]\{36\}'::uuid/'00000000-0000-0000-0000-000000000000'::uuid/g" production-decisions.sql

# On Windows (PowerShell)
(Get-Content production-decisions.sql) -replace "'[0-9a-f-]{36}'::uuid", "'00000000-0000-0000-0000-000000000000'::uuid" | Set-Content production-decisions.sql
```

### Step 4: Import to Dev

```bash
psql "postgresql://postgres:[dev-password]@db.xxxxx.supabase.co:5432/postgres" \
  < production-decisions.sql
```

---

## Method 4: Quick and Dirty (Manual Copy-Paste)

If you only have a few decisions:

1. **Production**: Select all data from Table Editor
2. Copy the rows
3. **Dev**: Paste into Table Editor
4. **Dev SQL Editor**: Run this to fix user_ids:
```sql
UPDATE decisions
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid;
```

---

## Verification

After importing, verify everything worked:

```sql
-- Check how many decisions were imported
SELECT COUNT(*) FROM decisions;

-- Verify all use the public user ID
SELECT DISTINCT user_id FROM decisions;
-- Should only show: 00000000-0000-0000-0000-000000000000

-- Check a few sample decisions
SELECT id, title, category, date_created, user_id
FROM decisions
ORDER BY date_created DESC
LIMIT 5;
```

---

## Keeping Dev Data Synced (Optional)

If you want to periodically refresh dev data from production:

### Option 1: Manual Refresh Script

Save this as `sync-to-dev.sql`:

```sql
-- 1. Clear dev data
TRUNCATE decisions CASCADE;

-- 2. Copy from production (you'll need to re-run the export query from Method 1)
-- ... paste INSERT statements here ...
```

### Option 2: Scheduled Sync

You could create a simple script that runs weekly:
1. Export from production
2. Clear dev database
3. Import fresh data
4. Update all user_ids to public ID

---

## My Recommendation

**For your situation, I recommend Method 2 (Option A):**

1. ✅ Export CSV from production (easy, no SQL needed)
2. ✅ Import CSV to dev using Table Editor
3. ✅ Run simple UPDATE query to change all user_ids

It's the perfect balance of easy and reliable!

### Quick Command Summary

```sql
-- PRODUCTION: Export to CSV via Table Editor (download button)

-- DEV: Import CSV via Table Editor (import button)

-- DEV: Update all user IDs
UPDATE decisions
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- DEV: Verify
SELECT COUNT(*), user_id FROM decisions GROUP BY user_id;
```

---

## Troubleshooting

**"Duplicate key value violates unique constraint"**
- Decision IDs are conflicting
- Solution: Clear dev database first: `TRUNCATE decisions CASCADE;`

**"Foreign key constraint violated"**
- Check if you have the user_id column set up correctly
- Solution: Run the dev migration again (`005_dev_public_access.sql`)

**"Column does not exist"**
- Schema mismatch between prod and dev
- Solution: Run `schema.sql` again in dev

**Data looks weird/corrupted**
- CSV encoding issues
- Solution: Use Method 1 (SQL export) instead of CSV

---

Need help with any of these methods? Let me know which approach you prefer!
