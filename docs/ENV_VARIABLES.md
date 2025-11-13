# Environment Variables Setup

This guide explains all environment variables needed for the Decision Log API to function correctly.

---

## Table of Contents

1. [Quick Setup](#quick-setup)
2. [Required Variables](#required-variables)
3. [Optional Variables](#optional-variables)
4. [Getting Values from Supabase](#getting-values-from-supabase)
5. [Troubleshooting](#troubleshooting)

---

## Quick Setup

### Step 1: Create `.env.local` File

In your project root, create a file named `.env.local`:

```bash
# In project root
touch .env.local
```

**Windows PowerShell:**
```powershell
New-Item .env.local
```

### Step 2: Add Environment Variables

Copy this template into `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Direct database connection (for migrations/seeding)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Step 3: Get Your Values

See [Getting Values from Supabase](#getting-values-from-supabase) below.

### Step 4: Restart Dev Server

After adding/changing environment variables:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

---

## Required Variables

### NEXT_PUBLIC_SUPABASE_URL

**What it is:** The URL of your Supabase project.

**Format:** `https://xxxxxxxxxxxxx.supabase.co`

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

**Why it's needed:** The Supabase client uses this to connect to your database.

**Where to get it:**
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **Settings** (gear icon) in left sidebar
4. Click **API** in settings menu
5. Find **Project URL** under "Project Configuration"
6. Copy the URL

**Note:** The `NEXT_PUBLIC_` prefix means this variable is accessible in both server-side and client-side code.

---

### NEXT_PUBLIC_SUPABASE_ANON_KEY

**What it is:** The anonymous/public API key for your Supabase project.

**Format:** Long JWT token string (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxOTU2NTcxMjAwfQ...
```

**Why it's needed:** Authenticates API requests to Supabase.

**Where to get it:**
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **Settings** → **API**
4. Find **Project API keys** section
5. Copy the **anon** / **public** key (NOT the service_role key)

**Security note:** This key is safe to use in client-side code (hence `NEXT_PUBLIC_` prefix). It only allows operations permitted by your Row-Level Security (RLS) policies.

---

## Optional Variables

### DATABASE_URL

**What it is:** Direct PostgreSQL connection string.

**Format:** `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

**Example:**
```bash
DATABASE_URL=postgresql://postgres:your-database-password@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**When you need it:**
- Running database migrations
- Seeding data with `scripts/seed-database.ts`
- Direct database access (not using Supabase client)

**Where to get it:**
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **Settings** → **Database**
4. Scroll to **Connection string** section
5. Select **URI** tab
6. Copy the connection string
7. Replace `[YOUR-PASSWORD]` with your database password

**Security note:** Keep this secret! It grants direct database access. Never commit to version control.

---

### NODE_ENV (Auto-set by Next.js)

**What it is:** Indicates the environment (development, production, test).

**Format:** `development` | `production` | `test`

**You don't need to set this manually.** Next.js sets it automatically:
- `npm run dev` → `NODE_ENV=development`
- `npm run build` → `NODE_ENV=production`

**Why it matters:** In production, error messages hide sensitive details (stack traces, etc.).

---

## Getting Values from Supabase

### Visual Guide

1. **Login to Supabase**
   - Go to https://app.supabase.com
   - Sign in with your account

2. **Select Your Project**
   - Click on your "decision-log" project (or whatever you named it)

3. **Go to Settings → API**
   - Left sidebar: Click **Settings** (gear icon)
   - Settings menu: Click **API**

4. **Find Your Values**

   **Project URL:**
   - Section: "Configuration"
   - Field: "Project URL"
   - Example: `https://abcdefghijklmnop.supabase.co`

   **API Key:**
   - Section: "Project API keys"
   - Field: "anon" / "public" key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **⚠️ Copy the `anon` key, NOT the `service_role` key**

5. **Copy to `.env.local`**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## Example `.env.local` File

```bash
# ===========================================================================
# DECISION LOG - ENVIRONMENT VARIABLES
# ===========================================================================
# DO NOT COMMIT THIS FILE TO VERSION CONTROL
# Add this filename to .gitignore
# ===========================================================================

# Supabase Configuration (Required)
# Get these from: https://app.supabase.com → Your Project → Settings → API

NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxOTU2NTcxMjAwfQ.abcdefghijklmnopqrstuvwxyz1234567890

# Direct Database Connection (Optional - for seeding/migrations)
# Get from: Supabase → Settings → Database → Connection string (URI)
# Replace [YOUR-PASSWORD] with your actual database password

DATABASE_URL=postgresql://postgres:your-database-password@db.abcdefghijklmnop.supabase.co:5432/postgres

# ===========================================================================
# NOTES
# ===========================================================================
# - Restart dev server after changing these variables
# - NEXT_PUBLIC_ prefix = accessible in browser (safe for anon key)
# - DATABASE_URL = server-only (keep secret!)
# ===========================================================================
```

---

## Troubleshooting

### Error: "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL"

**Cause:** `.env.local` file doesn't exist or is missing the variable.

**Fix:**
1. Check `.env.local` file exists in project root
2. Verify it contains `NEXT_PUBLIC_SUPABASE_URL=https://...`
3. Ensure no typos in variable name
4. Restart dev server: `npm run dev`

---

### Error: "Failed to connect to database"

**Cause:** Incorrect Supabase URL or API key.

**Fix:**
1. Double-check values in Supabase dashboard (Settings → API)
2. Ensure you copied the full URL (including `https://`)
3. Verify you copied the **anon** key, not service_role key
4. Check for extra spaces or line breaks when pasting

---

### Error: "database connection timeout"

**Cause:** Supabase project is paused or network issue.

**Fix:**
1. Visit Supabase dashboard
2. Check if project status is "Active" (green)
3. If paused, unpause it
4. Check your internet connection
5. Try visiting the Supabase URL in browser to verify it's reachable

---

### Changes Not Taking Effect

**Cause:** Dev server caches environment variables.

**Fix:**
1. Stop dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Hard refresh browser (Ctrl+Shift+R)

---

### `.env.local` vs `.env`

**Use `.env.local` for:**
- Local development secrets
- Supabase credentials
- Database passwords

**Why not `.env`:**
- `.env` is often committed to version control (template)
- `.env.local` is git-ignored (contains secrets)

---

## Security Best Practices

### ✅ DO:
- ✅ Use `.env.local` for secrets
- ✅ Add `.env.local` to `.gitignore`
- ✅ Use `NEXT_PUBLIC_` prefix for client-safe variables only
- ✅ Keep `DATABASE_URL` secret (server-only)
- ✅ Rotate keys if accidentally exposed

### ❌ DON'T:
- ❌ Commit `.env.local` to git
- ❌ Share your `.env.local` file publicly
- ❌ Use `service_role` key in client code
- ❌ Hardcode secrets in source code

---

## Verifying Setup

Test that environment variables are loaded correctly:

```typescript
// In any component or API route
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Has API key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

You should see:
```
Supabase URL: https://abcdefghijklmnop.supabase.co
Has API key: true
```

If you see `undefined`, environment variables aren't loading.

---

## Next Steps

After setting up environment variables:

1. ✅ Test database connection:
   ```bash
   npm run dev
   curl http://localhost:3000/api/decisions
   ```

2. ✅ Seed sample data:
   ```bash
   npx ts-node scripts/seed-database.ts
   ```

3. ✅ Read API docs:
   - [API.md](./API.md) - Complete API reference
   - [API_ERRORS.md](./API_ERRORS.md) - Error troubleshooting

---

## Reference

| Variable | Required | Type | Example |
|----------|----------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | JWT | `eyJhbGci...` |
| `DATABASE_URL` | No | Connection string | `postgresql://postgres:...` |
| `NODE_ENV` | No (auto) | Enum | `development` / `production` |

---

## Further Reading

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Client Configuration](https://supabase.com/docs/reference/javascript/initializing)
- [Database Setup Guide](./DATABASE_SETUP.md)
