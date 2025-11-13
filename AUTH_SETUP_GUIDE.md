# Supabase Auth Setup Guide

## ✅ What's Been Implemented

### 1. **Auth Infrastructure**
- ✅ Installed `@supabase/ssr` package
- ✅ Created browser client (`lib/supabase/client.ts`)
- ✅ Created server client (`lib/supabase/server.ts`)
- ✅ Created middleware client (`lib/supabase/middleware.ts`)
- ✅ Added Next.js middleware for route protection (`middleware.ts`)

### 2. **Auth UI**
- ✅ Login page (`/login`)
- ✅ Signup page (`/signup`)
- ✅ Sign out button in header (desktop & mobile)
- ✅ User email display in header

### 3. **Security**
- ✅ Row Level Security migration created (`migrations/001_enable_auth_and_rls.sql`)
- ✅ API routes updated to check authentication
- ✅ `user_id` column added to Decision type
- ✅ Middleware redirects unauthenticated users to `/login`

---

## 🚀 Steps to Complete Setup

### Step 1: Enable Email Auth in Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/trjmxxjtcfmqysxlpaeh
2. Navigate to **Authentication** → **Providers**
3. Find **Email** provider
4. Make sure it's **enabled**
5. **Disable "Confirm email"** for easier testing (you can enable later)
   - Scroll to **Email Auth** settings
   - Toggle OFF "Confirm email" (otherwise users need to click email link to activate)

### Step 2: Run the RLS Migration

1. Open https://supabase.com/dashboard/project/trjmxxjtcfmqysxlpaeh/sql/new
2. Copy the contents of `migrations/001_enable_auth_and_rls.sql`
3. Paste into the SQL editor
4. **Before running**, decide what to do with existing decisions:

   **Option A: Start Fresh (Recommended)**
   ```sql
   -- Delete all existing test decisions
   DELETE FROM decisions;
   ```

   **Option B: Keep Existing Data**
   - First create a user account via `/signup`
   - Get your user ID from Supabase dashboard:
     - Go to **Authentication** → **Users**
     - Copy your User UID
   - Update existing decisions:
   ```sql
   UPDATE decisions SET user_id = 'your-user-id-here' WHERE user_id IS NULL;
   ```

5. After handling existing data, uncomment this line in the migration:
   ```sql
   ALTER TABLE decisions ALTER COLUMN user_id SET NOT NULL;
   ```

6. Click **RUN** to execute the migration

7. Verify RLS is working:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'decisions';
   -- rowsecurity should be TRUE
   ```

### Step 3: Test the Auth Flow

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit http://localhost:3001** - Should redirect to `/login`

3. **Create an account:**
   - Go to http://localhost:3001/signup
   - Enter email and password (min 6 characters)
   - Click "Create Account"
   - Should auto-login and redirect to home

4. **Test creating a decision:**
   - Should see your email in the header
   - Create a new decision
   - Verify it saves (check Supabase dashboard → Table Editor → decisions)
   - Verify `user_id` column is populated with your user ID

5. **Test sign out:**
   - Click the logout icon in header
   - Should redirect to `/login`

6. **Test sign in:**
   - Login with your credentials
   - Should see your decisions

7. **Test data isolation:**
   - Open an incognito window
   - Create a different account
   - Verify you don't see the first user's decisions

---

## 🔒 How Authentication Works

### Cookie-Based Sessions
- User logs in → Supabase creates a session
- Session stored in HTTP-only cookies (secure!)
- Middleware checks cookies on every request
- Invalid/missing session → redirect to `/login`

### Row Level Security (RLS)
- **Database-level security** - not just app-level
- Every query automatically filters by `user_id = auth.uid()`
- Users CANNOT see other users' data, even if they craft direct SQL queries
- Policies enforce:
  - SELECT: Only see your own decisions
  - INSERT: Can only create decisions with your `user_id`
  - UPDATE: Can only update your own decisions
  - DELETE: Can only delete your own decisions

### Middleware Protection
- `middleware.ts` runs on EVERY route
- Checks if user is authenticated
- Redirects to `/login` if not
- Public routes: `/login`, `/signup`, `/auth/*`

---

## 🐛 Troubleshooting

### "User must be logged in" Error
**Problem:** API returns 401 Unauthorized
**Solution:**
- Check if you're logged in (should see email in header)
- Clear cookies and login again
- Verify Supabase env vars are correct in `.env.local`

### "Permission denied for table decisions"
**Problem:** Database denies access
**Solution:**
- RLS is enabled but policies aren't created
- Run the migration SQL again
- Verify policies exist:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'decisions';
  ```

### "Can't create decision - user_id required"
**Problem:** Validation fails because user_id is missing
**Solution:**
- The API route should set `user_id` automatically from session
- Check `app/api/decisions/route.ts` has the auth check

### Infinite Redirect Loop
**Problem:** `/` redirects to `/login` which redirects back
**Solution:**
- Middleware config is wrong
- Check `middleware.ts` matcher excludes static files
- Clear browser cache/cookies

### Email Confirmation Required
**Problem:** "Check your email" message after signup
**Solution:**
- Go to Supabase → Authentication → Providers → Email
- Disable "Confirm email" for testing
- Or check your email inbox for confirmation link

---

## 🔐 Security Best Practices

### ✅ What's Secure:
- Passwords hashed by Supabase (bcrypt)
- Sessions use HTTP-only cookies (can't be accessed by JavaScript)
- RLS enforces data isolation at database level
- Middleware protects all routes
- API checks authentication before operations

### ⚠️ Still Need To Do (Optional):
1. **Enable Email Confirmation** (prevents fake signups)
2. **Add Password Reset** flow (`supabase.auth.resetPasswordForEmail()`)
3. **Add OAuth Providers** (Google, GitHub, etc.)
4. **Implement MFA** (multi-factor authentication)
5. **Add Rate Limiting** (prevent brute force attacks)
6. **Add Session Timeout** (auto-logout after inactivity)

---

## 📁 Files Modified/Created

### New Files:
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/middleware.ts` - Middleware auth logic
- `lib/hooks/useAuth.ts` - React hook for auth state
- `app/login/page.tsx` - Login UI
- `app/signup/page.tsx` - Signup UI
- `middleware.ts` - Next.js middleware
- `migrations/001_enable_auth_and_rls.sql` - Database migration

### Modified Files:
- `lib/supabase/client.ts` - Updated for SSR support
- `lib/types/decisions.ts` - Added `user_id` field
- `app/api/decisions/route.ts` - Added auth check
- `components/layout/Header.tsx` - Added sign out button
- `package.json` - Added `@supabase/ssr`

---

## 🎯 Next Steps After Auth Works

1. **Update All API Routes** - Add auth checks to:
   - `app/api/decisions/[id]/route.ts` (GET, PUT, DELETE)
   - `app/api/decisions/[id]/outcome/route.ts`
   - `app/api/decisions/[id]/flag-for-review/route.ts`
   - `app/api/decisions/[id]/similar/route.ts`
   - `app/api/decisions/analytics/summary/route.ts`

2. **Update Services** - Modify `lib/api/decisions-service.ts` to accept Supabase client parameter

3. **Add Profile Page** - `/profile` to manage email, password, delete account

4. **Add Team Features** (future)
   - Shared workspaces
   - Decision sharing
   - Collaboration

---

## 💡 Testing Checklist

- [ ] Run RLS migration in Supabase
- [ ] Signup creates account successfully
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials
- [ ] User email shows in header
- [ ] Sign out redirects to /login
- [ ] Protected pages redirect when not logged in
- [ ] Can create new decision
- [ ] Decision saved with correct user_id
- [ ] Can only see own decisions (test with 2 accounts)
- [ ] Cannot see other users' decisions
- [ ] Update decision works
- [ ] Delete decision works

---

Need help? Check the Supabase Auth docs: https://supabase.com/docs/guides/auth
