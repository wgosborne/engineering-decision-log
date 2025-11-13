# Database Setup Guide - Decision Log

This guide walks you through setting up the PostgreSQL database for your Decision Log app using Supabase.

## Prerequisites

- [ ] Supabase account (sign up at https://supabase.com if you don't have one)
- [ ] Node.js 18+ installed
- [ ] Project cloned locally

## Step 1: Create a Supabase Project

1. **Go to Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Click "New Project"

2. **Configure Your Project**
   - **Name:** `decision-log` (or your preferred name)
   - **Database Password:** Create a strong password (save it securely!)
   - **Region:** Choose the region closest to you
   - **Pricing Plan:** Free tier is sufficient for ~600 decisions/year
   - Click "Create new project"

3. **Wait for Provisioning**
   - Takes 1-2 minutes
   - You'll see a "Setting up your project..." message
   - Once ready, you'll see the project dashboard

## Step 2: Execute the Database Schema

1. **Open the SQL Editor**
   - In your Supabase project dashboard
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"** button (top right)

2. **Copy the Schema**
   - Open `schema.sql` from your project root
   - Copy the entire contents (Ctrl+A, Ctrl+C)

3. **Paste and Execute**
   - Paste into the SQL Editor in Supabase
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for execution to complete

4. **Verify Success**
   - You should see: `Success. No rows returned`
   - Check for any error messages in red

   **Common errors:**
   - If you see "type already exists" - the schema was already run. You can drop the types first or ignore if rerunning.
   - If you see "permission denied" - ensure you're logged into the correct project.

## Step 3: Verify the Schema

Run this verification query in the SQL Editor:

```sql
-- Check that the table was created
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'decisions'
ORDER BY ordinal_position;
```

**Expected output:** You should see ~40 rows showing all columns (id, date_created, title, etc.)

## Step 4: Verify Indexes

Run this query to confirm indexes were created:

```sql
-- Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'decisions'
ORDER BY indexname;
```

**Expected output:** You should see ~15 indexes including:
- `idx_decisions_category`
- `idx_decisions_search_vector`
- `idx_decisions_tags`
- etc.

## Step 5: Get Your Connection Details

1. **Find Your Project URL and Keys**
   - In Supabase dashboard, click **"Settings"** (gear icon in left sidebar)
   - Click **"API"** in the settings menu
   - Find these values:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **Project API Key** (anon/public key)

2. **Find Your Database Connection String** (optional, for direct PostgreSQL access)
   - In Supabase dashboard, click **"Settings"** → **"Database"**
   - Scroll to **"Connection string"**
   - Select **"URI"** tab
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your database password

## Step 6: Configure Environment Variables

1. **Create `.env.local` file** in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Direct database connection (for migrations/seeding)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

2. **Add to `.gitignore`** (should already be there):

```gitignore
.env.local
.env*.local
```

3. **Never commit** `.env.local` to version control!

## Step 7: Install Supabase Client

Install the Supabase JavaScript client library:

```bash
npm install @supabase/supabase-js
```

## Step 8: Create Supabase Client Utility

Create a file at `lib/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

## Step 9: Test the Connection

Create a test API route at `app/api/test/route.ts`:

```typescript
import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from('decisions')
      .select('count')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Database connection working!'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to database'
    }, { status: 500 });
  }
}
```

Test it by running:
```bash
npm run dev
# Then visit: http://localhost:3000/api/test
```

You should see: `{"success":true,"message":"Database connection working!"}`

## Step 10: Seed Sample Data (Optional)

To add example data for testing:

1. **Option A: Use SQL Editor**
   - Open `docs/SAMPLE_DATA.sql`
   - Copy contents
   - Paste into Supabase SQL Editor
   - Click "Run"

2. **Option B: Use Seeding Script**
   ```bash
   npm install -D ts-node
   npx ts-node scripts/seed-database.ts
   ```

## Step 11: Enable Full-Text Search (Already Done!)

The schema includes full-text search setup automatically:
- ✅ `search_vector` column created
- ✅ GIN index on `search_vector` created
- ✅ Trigger to auto-update `search_vector` created

**Test full-text search:**
```sql
SELECT title, project_name, category
FROM decisions
WHERE search_vector @@ to_tsquery('english', 'database & performance');
```

## Troubleshooting

### Error: "relation decisions already exists"
**Solution:** The schema was already executed. Either:
- Drop the table: `DROP TABLE decisions CASCADE;`
- Or skip re-running the schema

### Error: "permission denied for schema public"
**Solution:** Ensure you're using the correct database password and connection string.

### Error: "database connection timeout"
**Solution:**
- Check your internet connection
- Verify the Supabase project is still active (not paused)
- Check that you're using the correct project URL

### Can't connect from Next.js app
**Solution:**
1. Verify `.env.local` exists and has correct values
2. Restart your dev server: `npm run dev`
3. Check browser console for errors
4. Ensure `NEXT_PUBLIC_` prefix is on environment variables used client-side

### Indexes not being used
**Solution:**
- Run `ANALYZE decisions;` to update query planner statistics
- Check query plans with `EXPLAIN ANALYZE SELECT ...`
- See `docs/INDEXES_EXPLAINED.md` for details

## Row-Level Security (RLS) Notes

Currently, **RLS is disabled** for single-user apps.

When you're ready to add authentication and multi-user support:

1. **Enable RLS:**
   ```sql
   ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
   ```

2. **Add user_id column:**
   ```sql
   ALTER TABLE decisions ADD COLUMN user_id UUID REFERENCES auth.users(id);
   ```

3. **Create policies** (see commented section in `schema.sql`)

4. **Update application** to include user_id in all queries

## Next Steps

✅ Database is set up!
✅ Schema is created
✅ Indexes are working
✅ Connection is configured

**Now you can:**
1. Build your first form to create decisions
2. Create API routes for CRUD operations
3. Run pattern analysis queries (see `docs/USEFUL_QUERIES.md`)
4. Build the decision list view

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [SQL Editor in Supabase](https://supabase.com/docs/guides/database/overview)

## Support

If you encounter issues:
1. Check Supabase status page: https://status.supabase.com
2. Review Supabase logs in Dashboard → Logs
3. Check browser console for client-side errors
4. Review this guide's troubleshooting section
