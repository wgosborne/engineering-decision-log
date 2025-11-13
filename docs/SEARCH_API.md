# Search API Reference

Complete reference for search and filter functionality in the Decision Log API.

## Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Search Endpoint](#search-endpoint)
- [Query Parameters](#query-parameters)
- [Response Format](#response-format)
- [Metadata](#metadata)
- [Sort Options](#sort-options)
- [Pagination](#pagination)
- [Filter Combinations](#filter-combinations)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

The search API allows you to:
- **Full-text search** across multiple fields (title, context, rationale, etc.)
- **Filter** by category, project, tags, confidence, outcome status, and flagged status
- **Sort** by date, confidence, or relevance
- **Paginate** through large result sets
- **Get metadata** for populating filter dropdowns

**Base URL:** `http://localhost:3001/api/decisions`

**Method:** `GET`

**Authentication:** None (currently - add auth later if needed)

---

## Quick Start

### Basic Search
```bash
curl "http://localhost:3001/api/decisions?search=database"
```

### Search with Filters
```bash
curl "http://localhost:3001/api/decisions?search=api&category=architecture&confidence_min=7"
```

### Get All Decisions (No Search)
```bash
curl "http://localhost:3001/api/decisions"
```

### List by Category
```bash
curl "http://localhost:3001/api/decisions?category=technical"
```

---

## Search Endpoint

### GET /api/decisions

List and search decisions with optional filtering, sorting, and pagination.

**URL:** `/api/decisions`

**Method:** `GET`

**Query Parameters:** See [Query Parameters](#query-parameters) section

**Response:** JSON object with decisions, pagination info, and metadata

---

## Query Parameters

All query parameters are **optional**. If none provided, returns all decisions sorted by newest first.

### Search Parameters

#### `search` (string)
Full-text search term across multiple fields.

**Searchable Fields:**
- title (weight: A - highest)
- context (weight: B)
- decision_made (weight: B)
- rationale (weight: C)
- alternatives_considered (weight: C)
- tags (weight: C)
- tradeoffs (weight: D)
- category (weight: D)
- project_name (weight: D)

**Validation:**
- Max length: 500 characters
- Automatically trimmed
- Special characters allowed (they're stripped by PostgreSQL)

**Behavior:**
- Uses PostgreSQL `plainto_tsquery` for natural language queries
- Multiple words are treated as AND (all must match)
- Case-insensitive
- Handles word stemming (e.g., "running" matches "run")
- Ignores stop words (e.g., "the", "a", "is")

**Examples:**
```bash
# Single term
?search=database

# Multiple terms (all must match)
?search=react typescript performance

# Phrases are treated as separate words
?search=API design
```

### Filter Parameters

#### `category` (string)
Filter by decision category.

**Valid Values:**
- `architecture` - System architecture decisions
- `technical` - Technical implementation choices
- `process` - Team process and workflow
- `learning` - Learning and skill development
- `tool` - Tool selection and usage

**Example:**
```bash
?category=architecture
```

#### `project` (string)
Filter by project name.

**Validation:**
- Any string
- Automatically trimmed
- Case-sensitive exact match

**Example:**
```bash
?project=MyApp
```

#### `tags` (string, comma-separated)
Filter by one or more tags.

**Format:** Comma-separated list

**Behavior:**
- Matches decisions that have ANY of the specified tags (OR logic)
- Tag matching is case-sensitive

**Validation:**
- Max 10 tags per query
- Each tag automatically trimmed
- Duplicates removed

**Examples:**
```bash
# Single tag
?tags=react

# Multiple tags (OR logic)
?tags=react,typescript,performance
```

#### `confidence_min` (integer)
Filter by minimum confidence level.

**Range:** 1-10

**Example:**
```bash
?confidence_min=7
```

#### `confidence_max` (integer)
Filter by maximum confidence level.

**Range:** 1-10

**Example:**
```bash
?confidence_max=8
```

#### `confidence_min` + `confidence_max` (range)
Filter by confidence range.

**Validation:**
- Both must be 1-10
- `confidence_min` must be ≤ `confidence_max`

**Examples:**
```bash
# Confidence between 7 and 10
?confidence_min=7&confidence_max=10

# Only high confidence (9-10)
?confidence_min=9
```

#### `outcome_status` (string)
Filter by outcome status.

**Valid Values:**
- `all` - All decisions (default)
- `pending` - No outcome recorded yet (`outcome_success` is NULL)
- `success` - Positive outcome (`outcome_success = true`)
- `failed` - Negative outcome (`outcome_success = false`)

**Examples:**
```bash
# Only successful outcomes
?outcome_status=success

# Only decisions needing outcome update
?outcome_status=pending
```

#### `flagged` (boolean)
Filter by flagged status.

**Valid Values:**
- `true` - Only flagged decisions
- `false` - Only unflagged decisions
- (omit) - All decisions regardless of flag status

**Examples:**
```bash
# Only flagged decisions
?flagged=true

# Only unflagged decisions
?flagged=false
```

### Sort Parameters

#### `sort` (string)
Sort order for results.

**Valid Values:**
- `date-desc` - Newest first (default when no search term)
- `date-asc` - Oldest first
- `confidence-desc` - Highest confidence first
- `confidence-asc` - Lowest confidence first
- `relevance` - Most relevant first (default when search term provided)

**Default Behavior:**
- With `search` parameter: defaults to `relevance`
- Without `search`: defaults to `date-desc`
- If you specify `relevance` without a search term, falls back to `date-desc`

**Examples:**
```bash
# Sort by relevance (requires search term)
?search=database&sort=relevance

# Sort by confidence
?sort=confidence-desc

# Oldest first
?sort=date-asc
```

### Pagination Parameters

#### `limit` (integer)
Number of results per page.

**Range:** 1-100

**Default:** 20

**Validation:**
- Values > 100 are capped at 100
- Non-integer values return 400 error

**Examples:**
```bash
# Get 50 results
?limit=50

# Get max results
?limit=100
```

#### `offset` (integer)
Number of results to skip (for pagination).

**Range:** 0+

**Default:** 0

**Validation:**
- Negative values auto-corrected to 0
- Non-integer values return 400 error

**Examples:**
```bash
# First page (0-19)
?limit=20&offset=0

# Second page (20-39)
?limit=20&offset=20

# Third page (40-59)
?limit=20&offset=40
```

**Pagination Math:**
```
page_number = (offset / limit) + 1
offset = (page_number - 1) * limit
total_pages = ceil(total / limit)
```

---

## Response Format

All successful responses follow this structure:

```json
{
  "success": true,
  "data": {
    "decisions": [...],
    "total": 142,
    "hasMore": true,
    "limit": 20,
    "offset": 0,
    "metadata": {...}
  },
  "timestamp": "2025-01-09T12:34:56.789Z"
}
```

### Response Fields

#### `success` (boolean)
Always `true` for successful responses.

#### `data` (object)
Contains the actual response data.

##### `data.decisions` (array)
Array of decision objects matching the query.

**Decision Object Structure:**
```json
{
  "id": "uuid-here",
  "title": "Choose database for project",
  "context": "Need to select a database...",
  "decision_made": "Use PostgreSQL",
  "rationale": "...",
  "category": "technical",
  "project_name": "MyApp",
  "tags": ["database", "postgresql"],
  "confidence_level": 8,
  "alternatives_considered": ["MongoDB", "MySQL"],
  "tradeoffs": {...},
  "outcome": "Still pending evaluation",
  "outcome_success": null,
  "outcome_date": null,
  "lessons_learned": null,
  "similar_decision_ids": [],
  "similarity_notes": null,
  "flagged": false,
  "revisit_reason": null,
  "next_review_date": null,
  "created_at": "2025-01-09T10:00:00.000Z",
  "updated_at": "2025-01-09T10:00:00.000Z"
}
```

##### `data.total` (integer)
Total number of decisions matching the query (across all pages).

**Use for:**
- Showing "X of Y results"
- Calculating total pages
- Determining if pagination needed

##### `data.hasMore` (boolean)
Whether there are more results beyond the current page.

**Calculation:**
```typescript
hasMore = offset + decisions.length < total
```

**Use for:**
- "Load More" buttons
- Disabling "Next Page" button
- Infinite scroll

##### `data.limit` (integer)
The limit used for this query (echoed back).

##### `data.offset` (integer)
The offset used for this query (echoed back).

##### `data.metadata` (object)
Metadata for populating filters. See [Metadata](#metadata) section.

#### `timestamp` (string)
ISO 8601 timestamp of when the response was generated.

---

## Metadata

Metadata provides information about available filter options. Useful for:
- Populating dropdown menus
- Showing available tags
- Displaying filter statistics

### Metadata Structure

```json
{
  "availableCategories": ["architecture", "technical", "learning"],
  "availableProjects": ["MyApp", "WebProject", "MobileApp"],
  "availableTags": ["react", "typescript", "database", "api", "performance"],
  "confidenceRange": {
    "min": 3,
    "max": 10
  },
  "outcomeStats": {
    "total": 142,
    "pending": 89,
    "success": 42,
    "failed": 11
  }
}
```

### Metadata Fields

#### `availableCategories` (array of strings)
List of categories that exist in your decisions.

**Use for:**
- Populating category filter dropdown
- Showing only categories that have data

**Note:** Only categories with at least one decision are included.

#### `availableProjects` (array of strings)
List of unique project names in your decisions.

**Sorted:** Alphabetically

**Use for:**
- Populating project filter dropdown
- Autocomplete suggestions

**Note:** NULL project names are excluded.

#### `availableTags` (array of strings)
List of all unique tags across all decisions.

**Sorted:** Alphabetically

**Use for:**
- Tag filter dropdown
- Tag autocomplete
- Tag cloud visualization

**Note:** Flattened from all decisions' tag arrays.

#### `confidenceRange` (object | undefined)
Minimum and maximum confidence levels in your decisions.

**Structure:**
```json
{
  "min": 3,
  "max": 10
}
```

**Use for:**
- Setting range slider min/max
- Validating confidence filter inputs

**Note:** Undefined if no decisions have confidence levels.

#### `outcomeStats` (object | undefined)
Statistics about decision outcomes.

**Structure:**
```json
{
  "total": 142,       // Total decisions
  "pending": 89,      // outcome_success is NULL
  "success": 42,      // outcome_success is true
  "failed": 11        // outcome_success is false
}
```

**Use for:**
- Dashboard statistics
- Outcome filter labels ("Pending (89)")
- Visualizations

---

## Sort Options

### Relevance Sorting (`sort=relevance`)

**Only works with search term.** Ranks results by how well they match the search query.

**Ranking Factors:**
- **Term frequency**: How often search terms appear
- **Field weights**: Where terms appear (title > context > tags)
- **Document length**: Shorter documents rank higher
- **Proximity**: Terms closer together rank higher

**Example:**

Search for "react performance"

**High Rank:**
- Title: "React Performance Optimization"
- Context: "Performance issues with React components"

**Low Rank:**
- Title: "Database Migration"
- Tradeoffs: "...react mentioned once...performance mentioned once..."

### Date Sorting

#### `date-desc` (default)
Newest decisions first.

**Sort by:** `created_at DESC`

**Use when:**
- Default view
- Showing recent decisions
- Timeline view

#### `date-asc`
Oldest decisions first.

**Sort by:** `created_at ASC`

**Use when:**
- Historical view
- Chronological analysis
- Finding earliest decisions

### Confidence Sorting

#### `confidence-desc`
Highest confidence first.

**Sort by:** `confidence_level DESC NULLS LAST`

**Use when:**
- Finding your most confident decisions
- Best practices reference
- High-quality decisions only

**Note:** Decisions without confidence come last.

#### `confidence-asc`
Lowest confidence first.

**Sort by:** `confidence_level ASC NULLS LAST`

**Use when:**
- Finding uncertain decisions
- Decisions that need review
- Learning opportunities

**Note:** Decisions without confidence come last.

---

## Pagination

### How Pagination Works

1. **First Request:**
```bash
GET /api/decisions?limit=20&offset=0
```
Returns decisions 1-20, `hasMore: true`

2. **Second Request (Next Page):**
```bash
GET /api/decisions?limit=20&offset=20
```
Returns decisions 21-40, `hasMore: true`

3. **Last Page:**
```bash
GET /api/decisions?limit=20&offset=120
```
Returns decisions 121-142, `hasMore: false`

### Pagination Best Practices

#### Use `hasMore` for Navigation
```typescript
const { data } = await fetch('/api/decisions?limit=20&offset=0');

if (data.hasMore) {
  // Show "Load More" button or "Next Page"
} else {
  // Hide pagination controls
}
```

#### Calculate Page Numbers
```typescript
const currentPage = Math.floor(offset / limit) + 1;
const totalPages = Math.ceil(total / limit);

console.log(`Page ${currentPage} of ${totalPages}`);
// Page 2 of 8
```

#### Build Next/Previous URLs
```typescript
const nextOffset = offset + limit;
const prevOffset = Math.max(0, offset - limit);

const nextUrl = `/api/decisions?limit=${limit}&offset=${nextOffset}`;
const prevUrl = `/api/decisions?limit=${limit}&offset=${prevOffset}`;
```

#### Reset Offset When Changing Filters
```typescript
// User changes category filter
setFilters({
  ...filters,
  category: 'architecture',
  offset: 0  // IMPORTANT: Reset to first page
});
```

### Infinite Scroll Pattern
```typescript
const [decisions, setDecisions] = useState([]);
const [offset, setOffset] = useState(0);
const [hasMore, setHasMore] = useState(true);

async function loadMore() {
  const response = await fetch(
    `/api/decisions?limit=20&offset=${offset}`
  );
  const { data } = await response.json();

  setDecisions([...decisions, ...data.decisions]);
  setOffset(offset + 20);
  setHasMore(data.hasMore);
}
```

---

## Filter Combinations

You can combine any filters together. All filters use **AND logic** (must match all).

### Example Combinations

#### 1. Search + Category
```bash
# Architecture decisions about databases
?search=database&category=architecture
```

#### 2. Search + Tags + Confidence
```bash
# High-confidence React decisions
?search=react&tags=frontend,ui&confidence_min=8
```

#### 3. Category + Project + Outcome
```bash
# Failed technical decisions in MyApp
?category=technical&project=MyApp&outcome_status=failed
```

#### 4. Flagged + Category
```bash
# Flagged architecture decisions
?flagged=true&category=architecture
```

#### 5. Complex Multi-filter
```bash
# High-confidence architecture decisions about APIs in MyApp that succeeded
?search=api
&category=architecture
&project=MyApp
&confidence_min=8
&outcome_status=success
&sort=relevance
&limit=50
```

### Filter Logic

**Search:** Matches text content
**Category:** Exact match
**Project:** Exact match
**Tags:** OR logic (matches any tag in the list)
**Confidence:** Range filter (min ≤ confidence ≤ max)
**Outcome:** Status match
**Flagged:** Boolean match

**Combined with AND:** All conditions must be true.

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      "confidence_min must be between 1 and 10",
      "limit must be between 1 and 100"
    ]
  },
  "timestamp": "2025-01-09T12:34:56.789Z"
}
```

### Common Errors

#### 400 Bad Request - Validation Error

**Causes:**
- Invalid parameter values
- Out of range numbers
- Invalid enum values

**Examples:**
```bash
# Confidence out of range
?confidence_min=15
# Error: "confidence_min must be between 1 and 10"

# Invalid category
?category=invalid
# Error: "Invalid category. Must be one of: architecture, technical, ..."

# Min > Max
?confidence_min=9&confidence_max=5
# Error: "confidence_min cannot be greater than confidence_max"

# Limit too high
?limit=500
# Auto-corrected to 100 (no error, but capped)
```

#### 500 Internal Server Error

**Causes:**
- Database connection issues
- Supabase errors
- Unexpected exceptions

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "details": null
  },
  "timestamp": "2025-01-09T12:34:56.789Z"
}
```

### Error Handling in Code

```typescript
try {
  const response = await fetch('/api/decisions?search=test');
  const data = await response.json();

  if (!data.success) {
    // Handle error
    console.error('Error:', data.error.message);

    if (data.error.details) {
      // Show validation errors
      data.error.details.forEach(err => console.error('- ' + err));
    }

    return;
  }

  // Use data.data.decisions
  const decisions = data.data.decisions;
} catch (err) {
  console.error('Network error:', err);
}
```

---

## Examples

### Example 1: Basic Search

**Request:**
```bash
GET /api/decisions?search=database
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Choose database for project",
        "context": "Need to select a database that scales well",
        "decision_made": "Use PostgreSQL",
        "category": "technical",
        "confidence_level": 8,
        "tags": ["database", "postgresql"],
        "created_at": "2025-01-08T10:00:00.000Z"
      }
    ],
    "total": 1,
    "hasMore": false,
    "limit": 20,
    "offset": 0,
    "metadata": {
      "availableCategories": ["technical", "architecture"],
      "availableProjects": ["MyApp"],
      "availableTags": ["database", "postgresql"]
    }
  },
  "timestamp": "2025-01-09T12:34:56.789Z"
}
```

### Example 2: Search with Multiple Filters

**Request:**
```bash
GET /api/decisions?search=react&category=technical&confidence_min=7&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "title": "Migrate to React 18",
        "context": "Need to upgrade from React 17",
        "decision_made": "Migrate incrementally",
        "category": "technical",
        "confidence_level": 9,
        "tags": ["react", "migration"],
        "created_at": "2025-01-07T15:30:00.000Z"
      },
      {
        "id": "123e4567-e89b-12d3-a456-426614174002",
        "title": "Choose React state management",
        "context": "App is growing, need better state management",
        "decision_made": "Use Zustand",
        "category": "technical",
        "confidence_level": 8,
        "tags": ["react", "state-management"],
        "created_at": "2025-01-06T09:15:00.000Z"
      }
    ],
    "total": 2,
    "hasMore": false,
    "limit": 10,
    "offset": 0,
    "metadata": {...}
  },
  "timestamp": "2025-01-09T12:34:56.789Z"
}
```

### Example 3: Pagination

**Request (Page 1):**
```bash
GET /api/decisions?limit=2&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [
      {"id": "decision-1", "title": "Decision 1", ...},
      {"id": "decision-2", "title": "Decision 2", ...}
    ],
    "total": 5,
    "hasMore": true,
    "limit": 2,
    "offset": 0
  }
}
```

**Request (Page 2):**
```bash
GET /api/decisions?limit=2&offset=2
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [
      {"id": "decision-3", "title": "Decision 3", ...},
      {"id": "decision-4", "title": "Decision 4", ...}
    ],
    "total": 5,
    "hasMore": true,
    "limit": 2,
    "offset": 2
  }
}
```

**Request (Page 3 - Last):**
```bash
GET /api/decisions?limit=2&offset=4
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [
      {"id": "decision-5", "title": "Decision 5", ...}
    ],
    "total": 5,
    "hasMore": false,
    "limit": 2,
    "offset": 4
  }
}
```

### Example 4: Filter by Tags

**Request:**
```bash
GET /api/decisions?tags=react,typescript,performance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "title": "Optimize React rendering",
        "tags": ["react", "performance"],
        "created_at": "2025-01-05T11:20:00.000Z"
      },
      {
        "id": "123e4567-e89b-12d3-a456-426614174004",
        "title": "Add TypeScript to project",
        "tags": ["typescript", "react"],
        "created_at": "2025-01-04T14:00:00.000Z"
      }
    ],
    "total": 2,
    "hasMore": false
  }
}
```

**Note:** Matches decisions with ANY of the specified tags (OR logic).

### Example 5: Flagged Decisions

**Request:**
```bash
GET /api/decisions?flagged=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174005",
        "title": "Evaluate database choice",
        "flagged": true,
        "revisit_reason": "Need to assess performance after 6 months",
        "next_review_date": "2025-07-01"
      }
    ],
    "total": 1,
    "hasMore": false
  }
}
```

### Example 6: Outcome Filter

**Request:**
```bash
GET /api/decisions?outcome_status=success
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174006",
        "title": "Switch to PostgreSQL",
        "outcome_success": true,
        "outcome": "Migration completed successfully",
        "lessons_learned": "Proper planning made migration smooth",
        "outcome_date": "2024-12-15"
      }
    ],
    "total": 1,
    "hasMore": false
  }
}
```

### Example 7: Sort by Confidence

**Request:**
```bash
GET /api/decisions?sort=confidence-desc&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [
      {
        "id": "decision-1",
        "title": "Use TypeScript",
        "confidence_level": 10
      },
      {
        "id": "decision-2",
        "title": "Deploy on AWS",
        "confidence_level": 9
      },
      {
        "id": "decision-3",
        "title": "Use React",
        "confidence_level": 9
      }
    ],
    "total": 142,
    "hasMore": true
  }
}
```

### Example 8: Empty Results

**Request:**
```bash
GET /api/decisions?search=nonexistentterm12345
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [],
    "total": 0,
    "hasMore": false,
    "limit": 20,
    "offset": 0,
    "metadata": {
      "availableCategories": [...],
      "availableProjects": [...],
      "availableTags": [...]
    }
  },
  "timestamp": "2025-01-09T12:34:56.789Z"
}
```

**Note:** Empty results still return metadata for filter dropdowns.

### Example 9: Complex Query

**Request:**
```bash
GET /api/decisions?search=api+design&category=architecture&project=MyApp&tags=rest,graphql&confidence_min=7&outcome_status=success&sort=relevance&limit=25&offset=0
```

**Translation:**
- Search for "api design"
- In architecture category
- For MyApp project
- With tags "rest" OR "graphql"
- Confidence level 7-10
- Successful outcomes only
- Sort by relevance
- Show 25 per page
- Page 1

---

## Next Steps

- **Configuration Details**: Read [SEARCH_CONFIGURATION.md](./SEARCH_CONFIGURATION.md) to understand how full-text search works
- **Frontend Integration**: Read [SEARCH_INTEGRATION.md](./SEARCH_INTEGRATION.md) for React integration examples
- **Main API Docs**: See [API.md](./API.md) for other endpoints (create, update, delete, etc.)

---

## Quick Reference

### All Query Parameters

| Parameter | Type | Default | Range/Values | Description |
|-----------|------|---------|--------------|-------------|
| `search` | string | - | 0-500 chars | Full-text search term |
| `category` | string | - | architecture, technical, process, learning, tool | Filter by category |
| `project` | string | - | any | Filter by project name |
| `tags` | string | - | comma-separated | Filter by tags (OR logic) |
| `confidence_min` | integer | - | 1-10 | Minimum confidence level |
| `confidence_max` | integer | - | 1-10 | Maximum confidence level |
| `outcome_status` | string | all | all, pending, success, failed | Filter by outcome |
| `flagged` | boolean | - | true, false | Filter by flagged status |
| `sort` | string | date-desc* | date-desc, date-asc, confidence-desc, confidence-asc, relevance | Sort order |
| `limit` | integer | 20 | 1-100 | Results per page |
| `offset` | integer | 0 | 0+ | Pagination offset |

\* `relevance` is default when `search` is provided

### Response Structure
```
{
  success: boolean
  data: {
    decisions: Decision[]
    total: number
    hasMore: boolean
    limit: number
    offset: number
    metadata: {
      availableCategories: string[]
      availableProjects: string[]
      availableTags: string[]
      confidenceRange?: { min: number, max: number }
      outcomeStats?: { total, pending, success, failed }
    }
  }
  timestamp: string
}
```
