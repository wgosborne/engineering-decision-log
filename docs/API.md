# Decision Log API Documentation

Complete API reference for the Decision Log backend API.

---

## Base URL

```
http://localhost:3000/api
```

In production: `https://yourdomain.com/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [Endpoints](#endpoints)
   - [POST /decisions](#post-decisions) - Create new decision
   - [GET /decisions](#get-decisions) - List decisions with filtering
   - [GET /decisions/:id](#get-decisionsid) - Get single decision
   - [PUT /decisions/:id](#put-decisionsid) - Update decision
   - [DELETE /decisions/:id](#delete-decisionsid) - Delete decision
   - [PUT /decisions/:id/outcome](#put-decisionsidoutcome) - Set outcome
   - [PUT /decisions/:id/flag-for-review](#put-decisionsidflag-for-review) - Flag for review
   - [POST /decisions/:id/similar](#post-decisionsidsimilar) - Mark as similar
   - [GET /decisions/analytics/summary](#get-decisionsanalyticssummary) - Analytics summary
4. [Error Codes](#error-codes)
5. [Usage Examples](#usage-examples)

---

## Authentication

Currently **no authentication** is required (single-user app).

Future: Will use Supabase Auth with JWT tokens.

---

## Response Format

All API responses follow this standard format:

### Success Response

```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { /* optional additional info */ }
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

### Validation Error Response

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

---

## Endpoints

### POST /decisions

Create a new decision.

**Request:**

```http
POST /api/decisions
Content-Type: application/json

{
  "title": "Choose Supabase as database",
  "business_context": "Need persistent storage for ~50 decisions/month with full-text search...",
  "problem_statement": "Select database that supports full-text search, JSONB, and has generous free tier...",
  "chosen_option": "Supabase (PostgreSQL)",
  "reasoning": "PostgreSQL's GIN indexes and full-text search are perfect for pattern analysis...",
  "confidence_level": 8,
  "category": "data-storage",
  "project_name": "Decision Log App",
  "optimized_for": ["learning", "flexibility", "simplicity"],
  "tradeoffs_accepted": ["Vendor lock-in", "Requires internet connection"],
  "tradeoffs_rejected": ["Firebase's simpler API"],
  "options_considered": [
    {
      "name": "Supabase",
      "description": "Hosted PostgreSQL",
      "pros": ["Full PostgreSQL features", "Generous free tier"],
      "cons": ["Vendor lock-in"]
    }
  ],
  "tags": ["postgres", "database"],
  "stakeholders": ["Adam"],
  "decision_type": "somewhat-reversible",
  "assumptions": ["Will use app regularly"],
  "invalidation_conditions": ["Usage drops below 10 decisions/month"],
  "next_review_date": "2025-02-09",
  "flagged_for_review": false
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "date_created": "2025-11-09T20:00:00.000Z",
    "date_updated": "2025-11-09T20:00:00.000Z",
    "title": "Choose Supabase as database",
    // ... all other fields
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**Validation Rules:**
- `title`: Required, 1-200 characters
- `business_context`: Required, min 20 characters
- `problem_statement`: Required, min 20 characters
- `chosen_option`: Required
- `reasoning`: Required, min 50 characters
- `confidence_level`: Required, integer 1-10
- `category`: Required, valid enum
- `project_name`: Required
- `optimized_for`: Required, array with at least 1 valid enum
- `tradeoffs_accepted`: Required, array with at least 1 string
- `tradeoffs_rejected`: Required, array
- `options_considered`: Required, array with at least 1 option object

---

### GET /decisions

List decisions with filtering, search, and pagination.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Full-text search | `postgres performance` |
| `category` | enum | Filter by category | `data-storage` |
| `project` | string | Filter by project name | `Decision Log App` |
| `tags` | string | Comma-separated tags | `postgres,database` |
| `confidence_min` | number | Min confidence (1-10) | `7` |
| `confidence_max` | number | Max confidence (1-10) | `10` |
| `outcome_status` | enum | all/pending/success/failed | `success` |
| `flagged` | boolean | Filter flagged decisions | `true` |
| `sort` | enum | date-desc/date-asc/confidence-desc/confidence-asc | `date-desc` |
| `limit` | number | Results per page (1-100) | `20` |
| `offset` | number | Skip N results | `0` |

**Request:**

```http
GET /api/decisions?search=database&category=data-storage&limit=10&sort=date-desc
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "decisions": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Choose Supabase as database",
        "category": "data-storage",
        "confidence_level": 8,
        // ... all other fields
      }
    ],
    "total": 42,
    "hasMore": true,
    "limit": 10,
    "offset": 0
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**Examples:**

```bash
# Get all decisions (default: 20 per page, sorted by date descending)
GET /api/decisions

# Search for "supabase" in any text field
GET /api/decisions?search=supabase

# Filter by category and project
GET /api/decisions?category=data-storage&project=Decision%20Log%20App

# Filter by multiple tags
GET /api/decisions?tags=postgres,performance,learning

# High-confidence decisions only
GET /api/decisions?confidence_min=8

# Successful decisions only
GET /api/decisions?outcome_status=success

# Flagged for review
GET /api/decisions?flagged=true

# Pagination: page 2 (skip 20, take 20)
GET /api/decisions?offset=20&limit=20

# Sort by confidence (highest first)
GET /api/decisions?sort=confidence-desc
```

---

### GET /decisions/:id

Get a single decision by ID.

**Request:**

```http
GET /api/decisions/123e4567-e89b-12d3-a456-426614174000
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "date_created": "2025-11-09T20:00:00.000Z",
    "date_updated": "2025-11-09T20:00:00.000Z",
    "title": "Choose Supabase as database",
    // ... all fields
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**Error Response (404 Not Found):**

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

---

### PUT /decisions/:id

Update an existing decision (partial update).

**Request:**

```http
PUT /api/decisions/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "confidence_level": 9,
  "tags": ["postgres", "database", "full-text-search"],
  "notes": "After 3 months, confidence has increased based on performance."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "date_updated": "2025-11-09T20:30:00.000Z",
    // ... all fields with updates applied
  },
  "timestamp": "2025-11-09T20:30:00.000Z"
}
```

**Notes:**
- All fields are optional (partial update)
- Cannot update: `id`, `date_created`, `search_vector`
- `date_updated` is auto-set by database trigger
- Validation rules apply to updated fields

---

### DELETE /decisions/:id

Delete a decision (hard delete).

**Request:**

```http
DELETE /api/decisions/123e4567-e89b-12d3-a456-426614174000
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "deleted_id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": {
    "message": "Decision with id \"...\" not found",
    "code": "NOT_FOUND"
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

---

### PUT /decisions/:id/outcome

Fill in decision outcome after the decision has played out.

**Request:**

```http
PUT /api/decisions/123e4567-e89b-12d3-a456-426614174000/outcome
Content-Type: application/json

{
  "outcome_success": true,
  "outcome": "After 3 months, Supabase has been excellent. Full-text search is fast, GIN indexes work perfectly.",
  "lessons_learned": "PostgreSQL's query power was worth the initial complexity. Free tier is very generous.",
  "outcome_date": "2025-02-09T10:00:00.000Z"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "outcome_success": true,
    "outcome": "After 3 months...",
    "lessons_learned": "PostgreSQL's query power...",
    "outcome_date": "2025-02-09T10:00:00.000Z",
    // ... all other fields
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**Validation:**
- `outcome_success`: Required, boolean
- `outcome`: Required, min 20 characters
- `lessons_learned`: Optional, min 20 characters if provided
- `outcome_date`: Optional, defaults to NOW() if not provided

---

### PUT /decisions/:id/flag-for-review

Flag or unflag a decision for review.

**Request:**

```http
PUT /api/decisions/123e4567-e89b-12d3-a456-426614174000/flag-for-review
Content-Type: application/json

{
  "flagged": true,
  "next_review_date": "2025-02-09",
  "revisit_reason": "Check if full-text search performance holds up with 200+ decisions"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "flagged_for_review": true,
    "next_review_date": "2025-02-09",
    "revisit_reason": "Check if full-text search...",
    // ... all other fields
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**Validation:**
- `flagged`: Required, boolean
- `next_review_date`: Optional, ISO-8601 date
- `revisit_reason`: Optional, min 10 characters if provided

---

### POST /decisions/:id/similar

Mark a decision as similar to another decision.

**Request:**

```http
POST /api/decisions/123e4567-e89b-12d3-a456-426614174000/similar
Content-Type: application/json

{
  "similar_to_id": "456e7890-e89b-12d3-a456-426614174111",
  "reason": "Both are database selection decisions with similar tradeoffs",
  "comparison": "This decision chose Supabase, while the other chose Firebase. Both optimized for speed and simplicity."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "similar_decision_ids": ["456e7890-e89b-12d3-a456-426614174111"],
    "similarity_notes": [
      {
        "related_decision_id": "456e7890-e89b-12d3-a456-426614174111",
        "reason": "Both are database selection...",
        "comparison": "This decision chose Supabase..."
      }
    ],
    // ... all other fields
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**Validation:**
- `similar_to_id`: Required, valid UUID
- `reason`: Required, min 10 characters
- `comparison`: Required, min 20 characters
- Cannot link decision to itself
- Cannot link to already-linked decision

---

### GET /decisions/analytics/summary

Get aggregated analytics data for dashboard.

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `period` | enum | week/month/quarter/all | `month` |
| `category` | enum | Optional category filter | none |

**Request:**

```http
GET /api/decisions/analytics/summary?period=month
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "total_decisions": 42,
    "decisions_by_category": {
      "data-storage": 8,
      "tool-selection": 12,
      "architecture": 15,
      "other": 7
    },
    "success_rate_by_category": {
      "data-storage": 87,
      "tool-selection": 91,
      "architecture": 73
    },
    "optimized_for_frequency": {
      "simplicity": 28,
      "speed": 22,
      "learning": 18,
      "reliability": 15
    },
    "tradeoffs_accepted_frequency": {
      "Increased complexity": 18,
      "Higher cost": 12,
      "Vendor lock-in": 10
    },
    "tradeoffs_rejected_frequency": {
      "Poor performance": 15,
      "No community support": 8
    },
    "average_confidence": 7.3,
    "decisions_with_outcomes": 25,
    "overall_success_rate": 84,
    "flagged_for_review_count": 5,
    "decisions_past_review_date": 2
  },
  "timestamp": "2025-11-09T20:00:00.000Z"
}
```

**Use Cases:**
- Dashboard summary widget
- Pattern discovery ("What do I optimize for most?")
- Success rate analysis
- Review reminder system

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `BAD_REQUEST` | 400 | Invalid request format |
| `NOT_FOUND` | 404 | Resource not found |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Usage Examples

### Using React Hook

```typescript
import { useDecisions } from '@/lib/hooks/useDecisions';

function MyComponent() {
  const { createDecision, listDecisions, isLoading, error } = useDecisions();

  const handleCreate = async () => {
    const decision = await createDecision({
      title: 'My Decision',
      business_context: 'Context...',
      // ... other required fields
    });
  };

  const handleList = async () => {
    const { decisions } = await listDecisions({
      search: 'database',
      limit: 10,
    });
  };
}
```

### Using fetch() Directly

```typescript
// Create decision
const response = await fetch('/api/decisions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Decision',
    // ... other fields
  }),
});

const result = await response.json();
if (result.success) {
  console.log('Created:', result.data);
}
```

### Using cURL

```bash
# Create decision
curl -X POST http://localhost:3000/api/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Choose Supabase",
    "business_context": "Need database...",
    "problem_statement": "Select database...",
    "chosen_option": "Supabase",
    "reasoning": "PostgreSQL features...",
    "confidence_level": 8,
    "category": "data-storage",
    "project_name": "Decision Log",
    "optimized_for": ["learning"],
    "tradeoffs_accepted": ["Vendor lock-in"],
    "tradeoffs_rejected": [],
    "options_considered": [
      {
        "name": "Supabase",
        "description": "Hosted PostgreSQL",
        "pros": ["Full features"],
        "cons": ["Lock-in"]
      }
    ]
  }'

# List decisions
curl http://localhost:3000/api/decisions?search=database&limit=5

# Get single decision
curl http://localhost:3000/api/decisions/123e4567-e89b-12d3-a456-426614174000

# Update decision
curl -X PUT http://localhost:3000/api/decisions/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"confidence_level": 9}'

# Delete decision
curl -X DELETE http://localhost:3000/api/decisions/123e4567-e89b-12d3-a456-426614174000

# Set outcome
curl -X PUT http://localhost:3000/api/decisions/123e4567-e89b-12d3-a456-426614174000/outcome \
  -H "Content-Type: application/json" \
  -d '{
    "outcome_success": true,
    "outcome": "Worked great!",
    "lessons_learned": "Trust the process"
  }'

# Get analytics
curl http://localhost:3000/api/decisions/analytics/summary?period=month
```

---

## Further Reading

- [API_ERRORS.md](./API_ERRORS.md) - Error troubleshooting guide
- [ENV_VARIABLES.md](./ENV_VARIABLES.md) - Environment setup
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database configuration
