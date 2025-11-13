# Database Migration Guide: Update Categories

## Overview
This guide helps you migrate your database to the new category structure:

**Removed categories:**
- `hiring`
- `team-structure`
- `vendor`

**Added categories:**
- `searching`
- `ui`

## Migration Scripts

Two migration scripts are provided:

### 1. `migration_update_categories_safe.sql` (RECOMMENDED)
**Best for:** Databases with existing data

**What it does:**
- Automatically migrates existing decisions from removed categories to `other`
- Safely handles data preservation
- Provides logging during migration

**Use this if:** You have existing decisions in your database

### 2. `migration_update_categories.sql`
**Best for:** Empty databases or manual data migration

**What it does:**
- Updates the enum type
- Requires manual data migration for existing decisions
- Will fail if decisions use removed categories

**Use this if:** Your database is empty or you want manual control

## How to Run the Migration

### Option A: Using psql (Command Line)

1. **Connect to your database:**
   ```bash
   psql -h your-database-host -U your-username -d your-database-name
   ```

2. **Run the safe migration:**
   ```bash
   \i migration_update_categories_safe.sql
   ```

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `migration_update_categories_safe.sql`
4. Copy and paste the contents
5. Click **Run**

### Option C: Using Database GUI (e.g., pgAdmin, TablePlus)

1. Open your database connection
2. Open the query editor
3. Load `migration_update_categories_safe.sql`
4. Execute the script

## Pre-Migration Checklist

Before running the migration:

- [ ] **Backup your database** (critical!)
- [ ] Check if you have existing decisions with removed categories:
  ```sql
  SELECT category, COUNT(*) as count
  FROM decisions
  WHERE category IN ('hiring', 'team-structure', 'vendor')
  GROUP BY category;
  ```
- [ ] Decide how to handle existing data:
  - Use safe migration (moves to 'other')
  - Manually update to specific new categories
- [ ] Stop your application (optional but recommended)

## Post-Migration Checklist

After running the migration:

- [ ] Verify the migration succeeded:
  ```sql
  SELECT category, COUNT(*) as count
  FROM decisions
  GROUP BY category
  ORDER BY count DESC;
  ```
- [ ] Restart your application
- [ ] Clear any caches (Redis, application cache, etc.)
- [ ] Test creating a new decision with `searching` category
- [ ] Test creating a new decision with `ui` category
- [ ] Verify dropdowns show correct categories
- [ ] Update any documentation

## Troubleshooting

### Error: "invalid input value for enum decision_category"

**Cause:** You have existing decisions with `hiring`, `team-structure`, or `vendor`

**Solution:** Use `migration_update_categories_safe.sql` instead, or manually update:
```sql
UPDATE decisions SET category = 'other' WHERE category = 'hiring';
UPDATE decisions SET category = 'other' WHERE category = 'team-structure';
UPDATE decisions SET category = 'other' WHERE category = 'vendor';
```

### Migration Hangs or Times Out

**Cause:** Large database with many decisions

**Solution:**
1. Add a timeout:
   ```sql
   SET statement_timeout = '60s';
   ```
2. Run during off-peak hours
3. Consider running updates in batches

### Need to Rollback

If something goes wrong:

1. **During migration:** Run `ROLLBACK;` in the same session
2. **After migration:** Restore from your backup

## Manual Category Mapping (Optional)

If you want to map old categories to specific new ones instead of 'other':

```sql
-- Example: Map 'hiring' to 'process'
UPDATE decisions SET category = 'process' WHERE category = 'hiring';

-- Example: Map 'team-structure' to 'other'
UPDATE decisions SET category = 'other' WHERE category = 'team-structure';

-- Example: Map 'vendor' to 'tool-selection'
UPDATE decisions SET category = 'tool-selection' WHERE category = 'vendor';
```

Run these **before** the migration script.

## Verification Query

After migration, verify all categories are valid:

```sql
-- Should return no rows
SELECT *
FROM decisions
WHERE category NOT IN (
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
```

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify you have database admin privileges
3. Ensure no other sessions are modifying the `decisions` table
4. Restore from backup if needed
