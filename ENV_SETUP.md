# Environment Variables Setup Guide

This guide explains how to manage database connections for different branches.

## Important: Environment Variables Are NOT in Git

Your actual database credentials (`.env.local`) are **NOT committed to the repository**. This keeps your credentials secure.

## How It Works

### Local Development

**You have 3 template files in the repo:**
- `.env.local.example` - Example template (UPDATE WITH YOUR CREDENTIALS)
- `.env.dev` - Dev database template (UPDATE WITH YOUR CREDENTIALS)
- `.env.prod` - Production database template (UPDATE WITH YOUR CREDENTIALS)

**When you switch branches, you manually switch which credentials you're using:**

```bash
# Working on dev branch? Use dev database
git checkout dev
cp .env.dev .env.local
npm run dev

# Working on main branch? Use production database
git checkout main
cp .env.prod .env.local
npm run dev
```

### Step-by-Step Setup

#### 1. Update the Template Files

Edit `.env.dev` with your dev database credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
```

Edit `.env.prod` with your production database credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
```

#### 2. Commit the Template Files

```bash
git add .env.dev .env.prod .env.local.example
git commit -m "Add environment templates"
git push
```

**These files will be tracked in git because they're templates** - you'll update them with your actual credentials but they're safe to commit since you control what's in them.

#### 3. Create Your Active .env.local

```bash
# For dev work
cp .env.dev .env.local

# OR for production work
cp .env.prod .env.local
```

`.env.local` is ignored by git, so your active credentials stay on your machine.

---

## Vercel Deployment

### Option 1: Separate Vercel Projects (Recommended)

**Create two Vercel projects:**

1. **Project: `engineering-decision-log`** (main branch)
   - Git Branch: `main`
   - Environment Variables:
     - `NEXT_PUBLIC_SUPABASE_URL` = production URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = production key

2. **Project: `engineering-decision-log-dev`** (dev branch)
   - Git Branch: `dev`
   - Environment Variables:
     - `NEXT_PUBLIC_SUPABASE_URL` = dev URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = dev key

**This is the cleanest approach** - each deployment automatically uses the right database.

### Option 2: One Vercel Project with Branch-Based Variables

1. Go to your Vercel project → **Settings** → **Environment Variables**

2. For each variable, set different values per environment:

   **`NEXT_PUBLIC_SUPABASE_URL`:**
   - Production: `https://prod.supabase.co` (applied to `main` branch)
   - Preview: `https://dev.supabase.co` (applied to `dev` branch)

   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`:**
   - Production: `prod-key` (applied to `main` branch)
   - Preview: `dev-key` (applied to `dev` branch)

3. Redeploy both branches

---

## Quick Reference

### Local Workflow

```bash
# Starting dev work
git checkout dev
cp .env.dev .env.local
npm run dev
# App uses dev database (public access)

# Starting production work
git checkout main
cp .env.prod .env.local
npm run dev
# App uses production database (with auth)
```

### Automated Script (Optional)

You can create a simple script to automatically switch env files:

**`switch-env.sh`** (Mac/Linux):
```bash
#!/bin/bash
BRANCH=$(git branch --show-current)

if [ "$BRANCH" = "dev" ]; then
    cp .env.dev .env.local
    echo "✅ Switched to DEV database"
elif [ "$BRANCH" = "main" ]; then
    cp .env.prod .env.local
    echo "✅ Switched to PRODUCTION database"
fi
```

**`switch-env.ps1`** (Windows PowerShell):
```powershell
$branch = git branch --show-current

if ($branch -eq "dev") {
    Copy-Item .env.dev .env.local -Force
    Write-Host "✅ Switched to DEV database"
} elseif ($branch -eq "main") {
    Copy-Item .env.prod .env.local -Force
    Write-Host "✅ Switched to PRODUCTION database"
}
```

Then run:
```bash
# Mac/Linux
./switch-env.sh

# Windows
.\switch-env.ps1
```

Or add to your `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:dev": "cp .env.dev .env.local && next dev",
    "dev:prod": "cp .env.prod .env.local && next dev"
  }
}
```

Then use:
```bash
npm run dev:dev   # Dev branch + dev database
npm run dev:prod  # Main branch + production database
```

---

## Security Notes

### ✅ Safe to Commit (Templates)
- `.env.local.example`
- `.env.dev` (template - update with your credentials)
- `.env.prod` (template - update with your credentials)

### ❌ Never Commit (Active Credentials)
- `.env.local` (ignored by git)
- Any file with actual secrets

### 🔐 Best Practices

1. **Never hardcode credentials** in your code
2. **Use environment variables** for all sensitive data
3. **Different databases** for dev and production
4. **Rotate keys** if accidentally exposed
5. **Use Vercel's environment variables** for deployments

---

## Troubleshooting

### "Can't connect to database"
- Check `.env.local` exists
- Verify the URL and key are correct
- Make sure you copied the right template

### "Seeing production data in dev"
- Check which `.env.local` you're using
- Run: `cp .env.dev .env.local`
- Restart dev server: `npm run dev`

### "Getting auth errors"
- Dev branch should use `.env.dev` (dev database, no auth)
- Main branch should use `.env.prod` (production database, with auth)

### "Changes not showing after branch switch"
- Restart your dev server after switching env files
- Clear Next.js cache: `rm -rf .next`

---

## Summary

| Branch | Code | Database | Env File | Auth |
|--------|------|----------|----------|------|
| `main` | With auth | Production | `.env.prod` | ✅ Enabled |
| `dev` | No auth | Dev | `.env.dev` | ❌ Disabled |

**Remember:**
- Code changes are in git branches
- Database credentials are NOT in git
- Manually switch `.env.local` when switching branches
- Vercel handles deployments automatically with its own env vars
