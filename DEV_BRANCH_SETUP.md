# Dev Branch Setup - Public Access

This document explains how to set up the dev branch for public access (no authentication).

## Overview

The dev branch has been configured to allow anyone to view and add decisions without authentication. This is useful for demo purposes or public testing.

## Code Changes Made

The following code changes have been made on the dev branch:

### 1. Middleware (lib/supabase/middleware.ts)
- ✅ Disabled authentication checks
- ✅ All routes are now publicly accessible

### 2. API Routes (app/api/decisions/route.ts)
- ✅ Removed authentication requirement for POST requests
- ✅ Uses a public user ID (`00000000-0000-0000-0000-000000000000`) for all decisions

### 3. Header Component (components/layout/Header.tsx)
- ✅ Removed user authentication checks
- ✅ "New Decision" button now always visible
- ✅ Removed user email and sign-out button

## Database Setup Required

**IMPORTANT**: You need to run the following SQL migration in your **DEV Supabase database** (not production!):

1. Go to your Supabase Dashboard
2. Select your **dev/test project** (NOT production)
3. Navigate to the SQL Editor
4. Run the migration: `migrations/005_dev_public_access.sql`

Or copy and run this SQL:

```sql
-- Disable Row Level Security
ALTER TABLE decisions DISABLE ROW LEVEL SECURITY;

-- Set default user_id for new decisions
ALTER TABLE decisions ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
```

### Verify the Migration

After running the migration, verify it worked:

```sql
-- Check if RLS is disabled (should show rowsecurity = false)
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'decisions';

-- Test querying all decisions (should return results without auth)
SELECT id, title, category, date_created FROM decisions ORDER BY date_created DESC LIMIT 10;
```

## Testing Locally

1. Make sure you're on the `dev` branch:
   ```bash
   git status
   ```

2. Install dependencies (if needed):
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser
   - You should see the dashboard immediately (no login required)
   - You should be able to view all decisions
   - You should be able to create new decisions using the quick entry or "New Decision" button

## Deploying to Vercel (Dev)

1. Ensure your dev branch is pushed to GitHub:
   ```bash
   git add .
   git commit -m "Configure dev branch for public access"
   git push origin dev
   ```

2. In Vercel:
   - Make sure the dev branch is deployed to a separate Vercel project or preview deployment
   - The environment variables should point to your **dev Supabase instance** (not production)
   - Verify these environment variables in Vercel:
     - `NEXT_PUBLIC_SUPABASE_URL` (your dev Supabase URL)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (your dev Supabase anon key)

3. After deployment, anyone with the Vercel dev link can:
   - View all decisions
   - Create new decisions
   - Edit existing decisions
   - No login required!

## Important Notes

### Security Considerations

⚠️ **WARNING**: This configuration makes your decision log **completely public**. Only use this for:
- Development/testing environments
- Public demos
- Non-sensitive data

❌ **DO NOT**:
- Run this configuration in production
- Store sensitive or private data in the dev environment
- Use the same database for dev and production

### Keeping Main Branch Secure

The `main` branch still has authentication enabled. When you merge changes:

1. **DO NOT merge** the following files to main:
   - `lib/supabase/middleware.ts`
   - `app/api/decisions/route.ts`
   - `components/layout/Header.tsx`

2. Or, merge them but keep the authentication code (not the "DEV BRANCH" comments)

3. **NEVER** run the `005_dev_public_access.sql` migration on your production database

### Reverting to Authenticated Mode

If you need to re-enable authentication on the dev branch:

```sql
-- Re-enable Row Level Security
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Remove default user_id
ALTER TABLE decisions ALTER COLUMN user_id DROP DEFAULT;
```

Then revert the code changes in the files mentioned above.

## Troubleshooting

### Issue: Can't see any decisions
- Check that the RLS migration was run successfully
- Verify RLS is disabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'decisions';`
- Check browser console for API errors

### Issue: Can't create decisions
- Verify the database migration set the default user_id
- Check the browser console for errors
- Make sure the API route is using the public user ID

### Issue: Getting authentication errors
- Clear your browser cookies
- Make sure you're running the dev branch, not main
- Verify the middleware changes were applied

## Summary

✅ **Code changes**: All authentication checks removed
✅ **Database setup**: Run migration to disable RLS
✅ **Testing**: Test locally before deploying
✅ **Deployment**: Push to Vercel dev environment
✅ **Access**: Anyone with the link can view and add decisions

---

For questions or issues, check the main project README or create an issue in the repository.
