# API Error Reference

This guide helps you debug and resolve errors from the Decision Log API.

---

## Table of Contents

1. [Error Response Format](#error-response-format)
2. [HTTP Status Codes](#http-status-codes)
3. [Common Errors](#common-errors)
4. [Validation Errors](#validation-errors)
5. [Database Errors](#database-errors)
6. [Debugging Tips](#debugging-tips)

---

## Error Response Format

All errors follow this consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE",
    "details": { /* optional additional context */ }
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

---

## HTTP Status Codes

| Code | Meaning | When It Happens |
|------|---------|-----------------|
| **400** | Bad Request | Invalid input, validation failed |
| **404** | Not Found | Decision doesn't exist |
| **405** | Method Not Allowed | Wrong HTTP method (e.g., POST to GET-only endpoint) |
| **500** | Internal Server Error | Unexpected server error, database issue |

---

## Common Errors

### 1. VALIDATION_ERROR (400)

**What it means:** Your request data failed validation.

**Example:**

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "title",
        "message": "This field is required"
      },
      {
        "field": "confidence_level",
        "message": "Must be between 1 and 10"
      }
    ]
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**How to fix:**
- Check the `details` array - it lists every invalid field
- Fix each field according to the validation message
- See [Validation Errors](#validation-errors) section for field-specific rules

---

### 2. NOT_FOUND (404)

**What it means:** The decision you're trying to access doesn't exist.

**Example:**

```json
{
  "success": false,
  "error": {
    "message": "Decision with id \"123e4567-e89b-12d3-a456-426614174000\" not found",
    "code": "NOT_FOUND"
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**Common causes:**
- Wrong UUID (typo in decision ID)
- Decision was deleted
- Using ID from different environment (e.g., production ID in local dev)

**How to fix:**
1. Verify the UUID is correct
2. Call `GET /api/decisions` to list available decisions
3. Check if the decision was deleted

---

### 3. BAD_REQUEST (400)

**What it means:** Request format is invalid (not validation-related).

**Example:**

```json
{
  "success": false,
  "error": {
    "message": "Invalid decision ID format (must be a valid UUID)",
    "code": "BAD_REQUEST"
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**Common causes:**
- Invalid UUID format (not following UUID pattern)
- Malformed JSON in request body
- Wrong query parameter format

**How to fix:**
- Check UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Validate JSON syntax (use a JSON validator)
- Check query parameter types (e.g., `limit` must be a number)

---

### 4. SERVER_ERROR (500)

**What it means:** Something unexpected went wrong on the server.

**Example:**

```json
{
  "success": false,
  "error": {
    "message": "Failed to create decision: database connection timeout",
    "code": "SERVER_ERROR",
    "details": { /* stack trace in development only */ }
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**Common causes:**
- Database is down or unreachable
- Supabase connection failed
- Missing environment variables
- Bug in server code

**How to fix:**
1. Check server logs (terminal where Next.js is running)
2. Verify database is running (Supabase project active)
3. Check environment variables are set (`.env.local`)
4. Try restarting the dev server

---

## Validation Errors

Detailed breakdown of validation rules for each field.

### Required Fields

These fields **must** be present when creating a decision:

| Field | Validation | Error Message |
|-------|------------|---------------|
| `title` | Required, 1-200 chars | "This field is required" / "Must be at most 200 characters" |
| `business_context` | Required, min 20 chars | "Must be at least 20 characters" |
| `problem_statement` | Required, min 20 chars | "Must be at least 20 characters" |
| `chosen_option` | Required | "This field is required" |
| `reasoning` | Required, min 50 chars | "Must be at least 50 characters" |
| `confidence_level` | Required, integer 1-10 | "Must be between 1 and 10" |
| `category` | Required, valid enum | "Invalid value. Must be one of: architecture, data-storage..." |
| `project_name` | Required | "This field is required" |
| `optimized_for` | Required, array with ≥1 item | "Must have at least 1 item" |
| `tradeoffs_accepted` | Required, array with ≥1 item | "Must have at least 1 item" |
| `tradeoffs_rejected` | Required, array | "Must be an array" |
| `options_considered` | Required, array with ≥1 option | "Must have at least 1 item" |

### Optional Fields

These fields are optional but must be valid if provided:

| Field | Validation | Error if Invalid |
|-------|------------|------------------|
| `tags` | Array of strings | "All items must be strings" |
| `stakeholders` | Array of strings | "All items must be strings" |
| `assumptions` | Array of strings | "All items must be strings" |
| `invalidation_conditions` | Array of strings | "All items must be strings" |
| `notes` | String | "Must be a string" |
| `decision_type` | Enum: reversible/somewhat-reversible/irreversible | "Invalid value" |
| `flagged_for_review` | Boolean | "Must be a boolean (true or false)" |
| `next_review_date` | ISO-8601 date | "Invalid date format (expected ISO-8601)" |
| `revisit_reason` | String | "Must be a string" |

### Enum Values

**Valid `category` values:**
- `architecture`
- `data-storage`
- `hiring`
- `tool-selection`
- `process`
- `project-management`
- `strategic`
- `technical-debt`
- `performance`
- `security`
- `team-structure`
- `vendor`
- `other`

**Valid `optimized_for` values:**
- `speed`
- `reliability`
- `cost`
- `simplicity`
- `scalability`
- `performance`
- `learning`
- `flexibility`
- `security`
- `maintainability`

**Valid `decision_type` values:**
- `reversible`
- `somewhat-reversible`
- `irreversible`

---

## Database Errors

Errors from PostgreSQL/Supabase operations.

### Connection Errors

**Error:**
```
Failed to create decision: database connection timeout
```

**Cause:** Can't connect to Supabase.

**Fix:**
1. Check internet connection
2. Verify Supabase project is active (not paused)
3. Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL`
4. Visit Supabase dashboard to verify project status

---

### Missing Environment Variables

**Error:**
```
Missing environment variable: NEXT_PUBLIC_SUPABASE_URL
Please add it to your .env.local file.
```

**Fix:**
1. Create `.env.local` file in project root
2. Add required variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Restart dev server: `npm run dev`

---

### Duplicate Entry

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Duplicate entry - this record already exists",
    "code": "BAD_REQUEST"
  }
}
```

**Cause:** Trying to create duplicate data (rare, as UUIDs prevent this).

**Fix:** Check if the decision already exists before creating.

---

## Debugging Tips

### 1. Check Server Logs

The terminal where you ran `npm run dev` shows detailed error logs:

```bash
Error in POST /api/decisions: Error: Validation failed
    at validateCreateDecision (lib/api/validation.ts:42)
    ...
```

Look for:
- Stack traces (where error occurred)
- Database error messages
- Validation failure details

### 2. Use Browser DevTools

Open Network tab (F12) to see:
- Request payload (what you sent)
- Response body (error details)
- Status code (400, 404, 500, etc.)

### 3. Test with cURL First

Isolate frontend vs backend issues:

```bash
# Test create endpoint
curl -X POST http://localhost:3000/api/decisions \
  -H "Content-Type: application/json" \
  -d '{ "title": "Test" }'
```

If cURL works but frontend doesn't, the issue is in your frontend code.

### 4. Validate JSON Syntax

Use [jsonlint.com](https://jsonlint.com) to check your JSON is valid.

Common mistakes:
- Missing comma between fields
- Trailing comma after last field
- Unescaped quotes in strings

### 5. Check TypeScript Types

If using TypeScript, ensure your data matches the types:

```typescript
import { Decision, NewDecision } from '@/lib/types/decisions';

const data: NewDecision = {
  title: 'My Decision',
  // TypeScript will error if required fields are missing
};
```

### 6. Test with Minimal Data First

Start with minimal required fields, then add optional fields:

```json
{
  "title": "Test",
  "business_context": "Testing the API with minimal data...",
  "problem_statement": "Verify API works before adding complexity...",
  "chosen_option": "Test option",
  "reasoning": "Testing validation to ensure the endpoint accepts minimal valid data...",
  "confidence_level": 5,
  "category": "other",
  "project_name": "Test Project",
  "optimized_for": ["simplicity"],
  "tradeoffs_accepted": ["Testing only"],
  "tradeoffs_rejected": [],
  "options_considered": [
    {
      "name": "Option 1",
      "description": "Test option",
      "pros": ["Simple"],
      "cons": []
    }
  ]
}
```

If this works, add fields incrementally to find which one causes the error.

---

## Quick Fixes Checklist

When you get an error:

- [ ] Check HTTP status code (400, 404, 500?)
- [ ] Read the error message and `details`
- [ ] Check server logs in terminal
- [ ] Verify `.env.local` has correct values
- [ ] Confirm database is running (Supabase dashboard)
- [ ] Validate JSON syntax
- [ ] Check all required fields are present
- [ ] Verify enum values are correct
- [ ] Confirm UUID format is valid
- [ ] Try with minimal valid data first
- [ ] Restart dev server if changing env vars

---

## Common Error Scenarios

### Scenario 1: "confidence_level must be between 1 and 10"

**Request:**
```json
{
  "confidence_level": 15
}
```

**Fix:**
```json
{
  "confidence_level": 8  // Must be 1-10
}
```

---

### Scenario 2: "reasoning must be at least 50 characters"

**Request:**
```json
{
  "reasoning": "It's good"
}
```

**Fix:**
```json
{
  "reasoning": "This option provides the best balance of performance, cost, and ease of use based on our requirements..."
}
```

---

### Scenario 3: "Invalid value. Must be one of: speed, reliability..."

**Request:**
```json
{
  "optimized_for": ["fast", "cheap"]
}
```

**Fix:**
```json
{
  "optimized_for": ["speed", "cost"]  // Use valid enum values
}
```

---

### Scenario 4: "Option at index 0 must have a 'pros' array"

**Request:**
```json
{
  "options_considered": [
    {
      "name": "Option 1",
      "description": "First option"
      // Missing "pros" and "cons"
    }
  ]
}
```

**Fix:**
```json
{
  "options_considered": [
    {
      "name": "Option 1",
      "description": "First option",
      "pros": ["Fast", "Cheap"],
      "cons": ["Complex"]
    }
  ]
}
```

---

## Getting Help

If you're still stuck:

1. **Check GitHub Issues:** [https://github.com/yourusername/decision-log/issues](https://github.com/yourusername/decision-log/issues)
2. **Review API docs:** [docs/API.md](./API.md)
3. **Check environment setup:** [docs/ENV_VARIABLES.md](./ENV_VARIABLES.md)
4. **Review database setup:** [docs/DATABASE_SETUP.md](./DATABASE_SETUP.md)

---

## Error Code Reference

| Code | Status | Typical Cause | Quick Fix |
|------|--------|---------------|-----------|
| `VALIDATION_ERROR` | 400 | Missing/invalid field | Check `details` array, fix each field |
| `BAD_REQUEST` | 400 | Malformed request | Check JSON syntax, UUID format |
| `NOT_FOUND` | 404 | Decision doesn't exist | Verify ID is correct |
| `SERVER_ERROR` | 500 | Database/server issue | Check logs, verify env vars, restart server |
