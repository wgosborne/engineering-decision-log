# Setting Up a Separate Dev Database in Supabase

Follow these steps to create a completely separate development database for your dev branch.

## Step 1: Create New Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account

2. **Click "New Project"**
   - Organization: Select your organization
   - **Project Name**: `engineering-decision-log-dev`
   - **Database Password**: Create a strong password and **SAVE IT**
   - **Region**: Choose the same as your production (or closest to you)
   - **Plan**: Free tier is fine for development

3. **Wait for Setup** (2-3 minutes)

## Step 2: Set Up Database Schema

Once your project is ready:

1. **Go to SQL Editor**
   - In your new dev project, click "SQL Editor" in the sidebar

2. **Run the Base Schema**
   - Copy the entire contents of `schema.sql` from your project
   - Paste it into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

   This creates:
   - All tables (decisions)
   - All indexes
   - All triggers
   - All enums

3. **Run the Dev Setup Migration**
   - Create a new query in SQL Editor
   - Copy the contents of `migrations/006_add_user_id_for_dev.sql`
   - Click "Run"

   This will:
   - Add the user_id column
   - Set default user_id for public access
   - Disable Row Level Security
   - Create necessary indexes

4. **Verify Setup**
   ```sql
   -- Check if RLS is disabled
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'decisions';
   -- Should show: rowsecurity = false

   -- Test the table exists
   SELECT COUNT(*) FROM decisions;
   -- Should return: 0 (empty table)
   ```

## Step 3: Add Sample Data (Optional)

If you want some test data:

1. Go to SQL Editor
2. Run the contents of `docs/SAMPLE_DATA.sql` (if you have sample data)
3. Or manually create a few test decisions through the app

## Step 4: Get Your New API Credentials

1. **In your dev project**, go to: **Settings** → **API**

2. **Copy these values**:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbGc...
   ```

3. **Update your local `.env.local`**:
   ```bash
   # DEV Database (use this for dev branch)
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-NEW-DEV-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-dev-anon-key
   ```

4. **Keep your production credentials safe**:
   - Save your old production credentials somewhere safe
   - You'll need them when you switch back to main branch

## Step 5: Test Locally

```bash
# Make sure you're on dev branch
git status

# Start the dev server
npm run dev

# Open http://localhost:3000
# You should see an empty decision log (no login required!)
```

Try:
- ✅ Viewing the dashboard (should load immediately)
- ✅ Creating a new decision
- ✅ Viewing the decision you created
- ✅ No authentication required!

## Step 6: Deploy to Vercel

### Option A: Create Separate Vercel Project (Recommended)

1. **Go to Vercel Dashboard**
2. **Import your repository again**
   - Give it a different name: `engineering-decision-log-dev`
3. **Configure Git**
   - Set it to only deploy the `dev` branch
4. **Add Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your new dev project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your new dev anon key
5. **Deploy!**

### Option B: Use Preview Deployments (Simpler)

1. **Go to your existing Vercel project**
2. **Settings** → **Environment Variables**
3. **For each variable**, select **"Preview"** environment:
   - Override with your dev database credentials
   - This makes preview deployments (like `dev` branch) use dev database
   - Production deployments (main branch) still use production database

## Step 7: Share Dev Link

After deploying:
- Get your Vercel preview/dev URL
- Share it with anyone who needs access
- No login required! 🎉

## Managing Two Databases

### Switching Between Dev and Prod Locally

**For Dev work (public access):**
```bash
git checkout dev
# Use .env.local with dev credentials
npm run dev
```

**For Production work (with auth):**
```bash
git checkout main
# Update .env.local with production credentials
npm run dev
```

**Tip**: You can create two env files:
- `.env.local.dev` (dev database)
- `.env.local.prod` (production database)

Then copy the one you need:
```bash
# For dev
cp .env.local.dev .env.local

# For production
cp .env.local.prod .env.local
```

### Database Management

**Dev Database:**
- ✅ RLS disabled
- ✅ Public access
- ✅ Safe to test/break things
- ✅ Can reset anytime

**Production Database:**
- ✅ RLS enabled
- ✅ Authentication required
- ✅ Real user data (be careful!)
- ⚠️ Never run dev migrations here!

## Troubleshooting

### "Cannot find table 'decisions'"
- Make sure you ran `schema.sql` in the SQL Editor
- Check you're connected to the right database

### "Row level security policy violated"
- Run the `005_dev_public_access.sql` migration
- Verify RLS is disabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'decisions';`

### "Can't create decisions"
- Check browser console for errors
- Verify the default user_id is set
- Make sure API is using the public user ID

### Wrong database in Vercel
- Check environment variables in Vercel settings
- Make sure preview/dev environment uses dev credentials
- Production environment uses production credentials

## Summary Checklist

- [ ] Created new Supabase project for dev
- [ ] Ran `schema.sql` to create tables
- [ ] Ran `005_dev_public_access.sql` to disable auth
- [ ] Verified RLS is disabled
- [ ] Updated `.env.local` with dev credentials
- [ ] Tested locally - can access without login
- [ ] Deployed to Vercel with dev database credentials
- [ ] Verified dev deployment works publicly
- [ ] Saved production credentials separately

---

**Need Help?**
- Check the main `DEV_BRANCH_SETUP.md` for code changes
- Visit Supabase docs: https://supabase.com/docs
- Check Next.js environment variables: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
