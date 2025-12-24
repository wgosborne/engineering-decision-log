# Vercel Deployment Guide - Dev vs Production

This guide shows you how to deploy both main (production with auth) and dev (public access) branches to Vercel.

## Overview

You have two branches with different configurations:
- **main**: Production database + authentication enabled
- **dev**: Dev database + no authentication (public access)

Each branch needs to use different Supabase credentials when deployed.

---

## Option 1: Single Project with Branch-Based Variables (Recommended)

Keep one Vercel project but use different environment variables for different branches.

### Step 1: Configure Environment Variables

1. **Go to Vercel Dashboard** → Your project → **Settings** → **Environment Variables**

2. **For `NEXT_PUBLIC_SUPABASE_URL`:**
   - Click **Add New**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://trjmxxjtcfmqysxlpaeh.supabase.co` (production)
   - **Check:** ☑️ Production
   - **Uncheck:** ☐ Preview, ☐ Development
   - Click **Save**

3. **Add Preview-Specific Override:**
   - Click **Add New** again
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://kvyssfgktkynqfzrxtmy.supabase.co` (dev)
   - **Check:** ☑️ Preview
   - **Uncheck:** ☐ Production, ☐ Development
   - Click **Save**

4. **For `NEXT_PUBLIC_SUPABASE_ANON_KEY`:**
   - Repeat the same process:
     - Production: Your prod anon key
     - Preview: Your dev anon key

### Step 2: Redeploy Both Branches

1. **Deployments** tab
2. Find the latest **main** deployment → **Redeploy**
3. Find the latest **dev** deployment → **Redeploy**

### Step 3: Get Your URLs

**Production URL (main branch):**
- Usually: `your-project.vercel.app`
- Uses: Production database + authentication

**Dev URL (dev branch):**
- Usually: `your-project-git-dev-yourname.vercel.app`
- Uses: Dev database + no authentication

---

## Option 2: Separate Vercel Projects (Cleaner)

Create two completely separate Vercel projects for total isolation.

### Step 1: Keep Existing Project for Production

1. **Go to your existing Vercel project**
2. **Settings** → **Git**
3. **Set "Production Branch" to:** `main`
4. **Ignored Build Step:** Add command to only build main:
   ```bash
   bash -c 'if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then exit 0; else exit 1; fi'
   ```
   (This makes it only deploy main branch)

5. **Settings** → **Environment Variables**
   - Make sure these are set for **Production only:**
     - `NEXT_PUBLIC_SUPABASE_URL`: Your prod URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your prod key

### Step 2: Create New Project for Dev

1. **Vercel Dashboard** → **Add New** → **Project**
2. **Import your same repository**
3. **Project Name:** `engineering-decision-log-dev`
4. **Configure Project:**
   - Framework Preset: Next.js
   - Build Command: (leave default)
   - Output Directory: (leave default)

5. **Settings** → **Git**
   - **Production Branch:** `dev`
   - This makes `dev` the main branch for this project

6. **Environment Variables:**
   - Add for **Production** (yes, production for this project):
     - `NEXT_PUBLIC_SUPABASE_URL`: `https://kvyssfgktkynqfzrxtmy.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (your dev anon key)

7. **Deploy**

### Step 3: Your URLs

**Production Project:**
- URL: `engineering-decision-log.vercel.app`
- Branch: `main`
- Database: Production (with auth)

**Dev Project:**
- URL: `engineering-decision-log-dev.vercel.app`
- Branch: `dev`
- Database: Dev (no auth)

---

## Testing Your Deployments

### Test Production Deployment (main branch)

1. Open your production URL
2. **Should see:** Login page
3. **Should require:** Sign in with credentials
4. **After login:** Can view/create decisions
5. **Database:** Production (your real data)

### Test Dev Deployment (dev branch)

1. Open your dev URL (or share it with anyone)
2. **Should see:** Dashboard immediately (no login!)
3. **Should allow:** Anyone to view all decisions
4. **Should allow:** Anyone to create decisions
5. **Database:** Dev (test data, separate from production)

---

## Troubleshooting

### Dev deployment shows login page
**Problem:** Using wrong environment variables (production database)

**Solution:**
1. Check environment variables in Vercel
2. Make sure Preview/Dev uses dev database credentials
3. Redeploy the dev branch

### Dev deployment can't connect to database
**Problem:** Wrong Supabase URL or key

**Solution:**
1. Compare with `.env.dev` file locally
2. Make sure you copied the credentials correctly
3. Verify the dev Supabase project exists

### Changes not showing after push
**Problem:** Vercel didn't trigger a new deployment

**Solution:**
1. Check the **Deployments** tab in Vercel
2. Manually trigger redeploy if needed
3. Check if there are build errors

### Getting auth errors on dev
**Problem:** Code changes didn't deploy or using wrong branch

**Solution:**
1. Verify you're on the dev URL (not production)
2. Check the deployment shows `dev` branch
3. Make sure you pushed your code changes to the dev branch

### "Foreign key constraint" error on dev
**Problem:** Database migration not run

**Solution:**
1. Run `migrations/008_force_remove_all_user_fk.sql` in dev Supabase
2. Verify with test insert in SQL Editor
3. Try creating decision again in deployed app

---

## Environment Variables Reference

### Production (main branch)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://trjmxxjtcfmqysxlpaeh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyam14eGp0Y2ZtcXlzeGxwYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjU1ODgsImV4cCI6MjA3ODMwMTU4OH0.dgVbekg1aCG_HHnVHmBFdjMVohRtt28x-em7_R3cNaU
```

### Dev (dev branch)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://kvyssfgktkynqfzrxtmy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eXNzZmdrdGt5bnFmenJ4dG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMzY5MDQsImV4cCI6MjA3ODYxMjkwNH0.Q8LG6n_g0ocu8ps78FlwHAzyPZOFzcSRw_G1LQcBE2U
```

---

## Quick Commands

```bash
# Push to trigger deployments
git push origin main    # Triggers production deployment
git push origin dev     # Triggers dev deployment

# Check which branch you're on
git branch --show-current

# Switch branches
git checkout main
git checkout dev
```

---

## Summary Checklist

- [ ] Environment variables configured in Vercel
- [ ] Production uses prod database credentials
- [ ] Preview/Dev uses dev database credentials
- [ ] Both branches pushed to GitHub
- [ ] Dev deployment shows no login page
- [ ] Production deployment requires login
- [ ] Can create decisions on dev without auth
- [ ] Saved both deployment URLs for reference

---

## Your Deployment URLs

Once set up, save these for quick access:

**Production (with auth):**
- URL: _______________________________
- Branch: `main`
- Database: Production
- Access: Requires login

**Dev (public access):**
- URL: _______________________________
- Branch: `dev`
- Database: Dev
- Access: Public (no login needed)

**Share the dev URL** with anyone who needs to test or demo the app!
