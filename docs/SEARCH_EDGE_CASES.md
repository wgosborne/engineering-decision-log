# Search Edge Cases Documentation

**Purpose:** Document edge cases, boundary conditions, and error handling in the search system
**Audience:** Developers, QA Engineers, Support Teams
**Last Updated:** 2025-11-10

---

## Table of Contents

1. [Search Term Edge Cases](#search-term-edge-cases)
2. [Filter Parameter Edge Cases](#filter-parameter-edge-cases)
3. [Pagination Edge Cases](#pagination-edge-cases)
4. [Sorting Edge Cases](#sorting-edge-cases)
5. [Data Edge Cases](#data-edge-cases)
6. [Security Edge Cases](#security-edge-cases)
7. [Network & System Edge Cases](#network--system-edge-cases)
8. [Combined Edge Cases](#combined-edge-cases)

---

## Search Term Edge Cases

### 1. Empty Search Term

**Input:**
```
?search=
```

**Behavior:**
- Treated as no search filter
- Returns all decisions (subject to other filters)
- No full-text search performed

**Validation:**
- ✅ Valid input
- No error thrown

**Code:**
```typescript
if (!search || search.trim().length === 0) {
  // Skip full-text search
  return allDecisions;
}
```

---

### 2. Whitespace-Only Search Term

**Input:**
```
?search=%20%20%20  // Three spaces
```

**Behavior:**
- Trimmed to empty string
- Treated same as empty search

**Validation:**
- ✅ Auto-sanitized
- Trimmed before processing

---

### 3. Very Long Search Term (> 500 chars)

**Input:**
```
?search=aaaaaa...  // 600 characters
```

**Behavior:**
- ❌ Rejected with validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Search term too long (max 500 characters)",
    "code": "VALIDATION_ERROR"
  }
}
```

**Validation:**
```typescript
if (searchTerm.length > SEARCH_LIMITS.MAX_SEARCH_LENGTH) {
  throw new ValidationError('Search term too long');
}
```

---

### 4. Special Characters in Search

**Input:**
```
?search=@#$%^&*()
```

**Behavior:**
- ✅ Handled gracefully
- PostgreSQL `plainto_tsquery` sanitizes special characters
- Characters ignored, alphabetic words searched

**Example:**
```
"API @endpoint #1" → searches for "API endpoint 1"
```

---

### 5. SQL Injection Attempt

**Input:**
```
?search='; DROP TABLE decisions; --
```

**Behavior:**
- ✅ Safe - parameterized queries prevent injection
- Treated as literal search string
- No SQL executed

**Security:**
```typescript
// Supabase client uses parameterized queries
query = query.textSearch('search_vector', searchTerm);
// searchTerm is passed as parameter, not concatenated
```

---

### 6. Unicode and International Characters

**Input:**
```
?search=データベース  // Japanese "database"
```

**Behavior:**
- ✅ Supported
- PostgreSQL full-text search handles Unicode
- May not match English-configured dictionary

**Note:** Full-text search is configured for English. For multi-language support, consider:
- Multiple search_vector columns with different languages
- Language-specific text search configurations

---

### 7. Numeric-Only Search

**Input:**
```
?search=12345
```

**Behavior:**
- ✅ Works
- Searches for numeric values in text fields
- May find decision IDs, version numbers, etc.

---

### 8. Search with Quotes

**Input:**
```
?search="exact phrase"
```

**Behavior:**
- ✅ Works
- `plainto_tsquery` handles quoted phrases
- Searches for phrase proximity

---

## Filter Parameter Edge Cases

### Category Filter

#### 1. Invalid Category

**Input:**
```
?category=invalid-category
```

**Behavior:**
- ❌ Validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid category. Must be one of: architecture, data-storage, hiring, ...",
    "code": "VALIDATION_ERROR"
  }
}
```

#### 2. Empty Category

**Input:**
```
?category=
```

**Behavior:**
- ✅ Treated as "no filter"
- Returns all categories

---

### Project Filter

#### 1. Non-Existent Project

**Input:**
```
?project=NonExistentProject
```

**Behavior:**
- ✅ No error
- Returns empty results (no decisions with that project)

**Difference from Category:**
- Category has fixed enum → validation error
- Project is dynamic → empty results OK

#### 2. Project Name with Spaces

**Input:**
```
?project=Decision%20Log%20App
```

**Behavior:**
- ✅ Works correctly
- URL encoding handled by framework
- Spaces preserved in query

---

### Tags Filter

#### 1. Empty Tags Array

**Input:**
```
?tags=
```

**Behavior:**
- ✅ Treated as no filter
- Returns all decisions

#### 2. Single Tag

**Input:**
```
?tags=learning
```

**Behavior:**
- ✅ Works
- Matches decisions with "learning" tag

#### 3. Multiple Tags (Comma-Separated)

**Input:**
```
?tags=learning,performance,database
```

**Behavior:**
- ✅ Works
- **OR logic:** Matches decisions with ANY of the tags

**SQL:**
```sql
WHERE tags && ARRAY['learning', 'performance', 'database']
```

#### 4. Too Many Tags (> 20)

**Input:**
```
?tags=tag1,tag2,tag3,...,tag25  // 25 tags
```

**Behavior:**
- ❌ Validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Too many tags (max 20)",
    "code": "VALIDATION_ERROR"
  }
}
```

#### 5. Duplicate Tags

**Input:**
```
?tags=learning,learning,performance
```

**Behavior:**
- ✅ Auto-deduplicated
- Sanitized to: `['learning', 'performance']`

**Code:**
```typescript
const sanitized = [...new Set(tags)];
```

#### 6. Tags with Special Characters

**Input:**
```
?tags=tag-with-dash,tag_with_underscore,tag.with.dot
```

**Behavior:**
- ✅ Works
- Tags stored as-is (no sanitization beyond trim)

---

### Confidence Filter

#### 1. Invalid Confidence (Out of Range)

**Input:**
```
?confidenceMin=11
?confidenceMax=0
?confidenceMin=-5
```

**Behavior:**
- ❌ Validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "confidenceMin must be between 1 and 10",
    "code": "VALIDATION_ERROR"
  }
}
```

#### 2. Min Greater Than Max

**Input:**
```
?confidenceMin=8&confidenceMax=5
```

**Behavior:**
- ❌ Validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "confidenceMin cannot be greater than confidenceMax",
    "code": "VALIDATION_ERROR"
  }
}
```

#### 3. Non-Integer Confidence

**Input:**
```
?confidenceMin=7.5
```

**Behavior:**
- ❌ Validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "confidenceMin must be an integer",
    "code": "VALIDATION_ERROR"
  }
}
```

#### 4. Confidence as String

**Input:**
```
?confidenceMin=seven
```

**Behavior:**
- ❌ Validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "confidenceMin must be a number",
    "code": "VALIDATION_ERROR"
  }
}
```

---

### Outcome Status Filter

#### 1. Invalid Outcome Status

**Input:**
```
?outcomeStatus=unknown
```

**Behavior:**
- ❌ Validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Outcome status must be one of: all, pending, success, failed",
    "code": "VALIDATION_ERROR"
  }
}
```

#### 2. Empty Outcome Status

**Input:**
```
?outcomeStatus=
```

**Behavior:**
- ✅ Default to "all"
- Returns all decisions

---

### Flagged Filter

#### 1. Flagged as String

**Input:**
```
?flagged=true   // String "true"
?flagged=false  // String "false"
```

**Behavior:**
- ✅ Converted to boolean
- "true" → `true`
- "false" → `false`

#### 2. Invalid Flagged Value

**Input:**
```
?flagged=yes
?flagged=1
```

**Behavior:**
- ❌ Validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Flagged must be a boolean (true or false)",
    "code": "VALIDATION_ERROR"
  }
}
```

---

## Pagination Edge Cases

### 1. Negative Offset

**Input:**
```
?offset=-10
```

**Behavior:**
- ✅ Auto-corrected to 0
- No error thrown

**Code:**
```typescript
const sanitizedOffset = Math.max(0, offset);
```

---

### 2. Offset Larger Than Total Results

**Input:**
```
?offset=99999  // Total results: 100
```

**Behavior:**
- ✅ Returns empty array
- No error
- `hasMore: false`

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [],
    "total": 100,
    "hasMore": false,
    "offset": 99999,
    "limit": 20
  }
}
```

---

### 3. Limit Exceeds Maximum (> 100)

**Input:**
```
?limit=500
```

**Behavior:**
- ✅ Auto-capped at 100
- No error

**Code:**
```typescript
const sanitizedLimit = Math.min(limit, SEARCH_LIMITS.MAX_LIMIT);
```

---

### 4. Limit Less Than 1

**Input:**
```
?limit=0
?limit=-5
```

**Behavior:**
- ❌ Validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Limit must be at least 1",
    "code": "VALIDATION_ERROR"
  }
}
```

---

### 5. Non-Integer Limit/Offset

**Input:**
```
?limit=20.5
?offset=10.7
```

**Behavior:**
- ❌ Validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Limit must be an integer",
    "code": "VALIDATION_ERROR"
  }
}
```

---

## Sorting Edge Cases

### 1. Invalid Sort Option

**Input:**
```
?sort=invalid-sort
```

**Behavior:**
- ❌ Validation error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Sort must be one of: date-desc, date-asc, confidence-desc, confidence-asc, relevance",
    "code": "VALIDATION_ERROR"
  }
}
```

---

### 2. Relevance Sort Without Search Term

**Input:**
```
?sort=relevance
```

**Behavior:**
- ✅ Auto-fallback to `date-desc`
- No error

**Reason:** Relevance sorting requires full-text search. Without search term, fall back to date.

---

### 3. Empty Sort Parameter

**Input:**
```
?sort=
```

**Behavior:**
- ✅ Default to `date-desc`
- If search term present, default to `relevance`

---

### 4. Sorting Null Values

**Scenario:** Sorting by confidence when some decisions have `confidence_level = NULL`

**Behavior:**
- ✅ Handled with `NULLS LAST`
- Null values appear at end of sorted results

**SQL:**
```sql
ORDER BY confidence_level DESC NULLS LAST
```

---

## Data Edge Cases

### 1. Empty Database (No Decisions)

**Input:**
```
?search=anything
```

**Behavior:**
- ✅ Returns empty array
- No error

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [],
    "total": 0,
    "hasMore": false,
    "metadata": {
      "availableCategories": [],
      "availableProjects": [],
      "availableTags": []
    }
  }
}
```

---

### 2. Decision with NULL Fields

**Scenario:** Decision has `reasoning = NULL`, `notes = NULL`

**Search Behavior:**
- ✅ Handled gracefully
- NULL fields excluded from full-text search
- No errors

**SQL:**
```sql
to_tsvector('english',
  COALESCE(title, '') || ' ' ||
  COALESCE(business_context, '') || ' ' ||
  COALESCE(reasoning, '')
)
```

---

### 3. Decision with Empty Tags Array

**Scenario:** `tags = []`

**Filter Behavior:**
- ✅ Works correctly
- `?tags=learning` will NOT match decision with empty tags

---

### 4. Decision with Very Long Title (5000+ chars)

**Scenario:** Title is 10,000 characters

**Behavior:**
- ✅ Stored and searched correctly
- Full-text index handles long fields
- May impact performance slightly

---

### 5. Decisions with Same Timestamp

**Scenario:** 10 decisions created at exact same millisecond

**Sort Behavior:**
- ✅ Works
- PostgreSQL stable sort maintains insertion order
- Results may vary between queries (non-deterministic order)

**Solution:** Add secondary sort key if deterministic order needed:
```sql
ORDER BY date_created DESC, id DESC
```

---

## Security Edge Cases

### 1. SQL Injection via Search Term

**Attack:**
```
?search=' OR '1'='1
```

**Protection:**
- ✅ Parameterized queries prevent injection
- Supabase client auto-escapes parameters

---

### 2. SQL Injection via Category

**Attack:**
```
?category=architecture' OR '1'='1
```

**Protection:**
- ✅ Enum validation prevents injection
- Only valid enum values accepted

---

### 3. NoSQL Injection (Not Applicable)

**Note:** PostgreSQL is SQL database, not NoSQL. NoSQL injection not applicable.

---

### 4. XSS via Search Term

**Attack:**
```
?search=<script>alert('XSS')</script>
```

**Protection:**
- ✅ API returns JSON (not HTML)
- Frontend must sanitize when rendering
- Search term stored as plain text, not executed

**Frontend Responsibility:**
- Use React's auto-escaping: `{decision.title}`
- Never use `dangerouslySetInnerHTML` with user input

---

### 5. ReDoS (Regular Expression Denial of Service)

**Attack:**
```
?search=(a+)+b  // Catastrophic backtracking
```

**Protection:**
- ✅ Not vulnerable - PostgreSQL full-text search doesn't use regex
- `plainto_tsquery` uses lexeme matching, not regex

---

### 6. Resource Exhaustion

**Attack:**
```
?limit=100&offset=0
?limit=100&offset=100
...
// Rapidly paginate through entire dataset
```

**Protection:**
- Rate limiting (implement at API gateway level)
- Monitor for abuse patterns
- Current: No built-in rate limiting

**Future Enhancement:**
```typescript
// Add rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

---

## Network & System Edge Cases

### 1. Database Connection Timeout

**Scenario:** Supabase connection times out

**Behavior:**
- ❌ Returns 500 error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Database connection failed",
    "code": "DATABASE_ERROR"
  }
}
```

**Retry:** Client should implement exponential backoff

---

### 2. Database Query Timeout

**Scenario:** Query takes > 30 seconds (Supabase timeout)

**Behavior:**
- ❌ Query cancelled, returns error

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Query timeout",
    "code": "DATABASE_ERROR"
  }
}
```

**Prevention:**
- Ensure indexes exist
- Monitor slow queries
- Optimize complex searches

---

### 3. Malformed JSON Response

**Scenario:** Database returns invalid JSON (rare)

**Behavior:**
- ❌ 500 error
- Server logs error

**Recovery:** Automatic retry may succeed

---

### 4. API Route Not Found

**Input:**
```
GET /api/decision  // Missing 's'
```

**Behavior:**
- ❌ 404 Not Found

**Response:**
```json
{
  "error": "Route not found"
}
```

---

### 5. Method Not Allowed

**Input:**
```
DELETE /api/decisions
```

**Behavior:**
- ❌ 405 Method Not Allowed

**Allowed Methods:** GET, POST

---

## Combined Edge Cases

### 1. All Filters Applied, No Results

**Input:**
```
?search=unicorn&category=architecture&project=NonExistent&tags=impossible&confidenceMin=10&outcomeStatus=success&flagged=true
```

**Behavior:**
- ✅ Returns empty array
- No error

**Response:**
```json
{
  "success": true,
  "data": {
    "decisions": [],
    "total": 0,
    "hasMore": false
  }
}
```

---

### 2. Conflicting Filters

**Input:**
```
?outcomeStatus=pending&outcomeStatus=success
```

**Behavior:**
- ✅ Last value wins
- URLSearchParams behavior: `outcomeStatus=success`

---

### 3. Invalid Filter + Valid Filter

**Input:**
```
?category=invalid&search=database
```

**Behavior:**
- ❌ Validation fails on first error
- Search not executed

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid category. Must be one of: ...",
    "code": "VALIDATION_ERROR"
  }
}
```

---

### 4. Multiple Errors

**Input:**
```
?confidenceMin=11&limit=500&offset=-10
```

**Behavior:**
- ❌ Returns all validation errors

**Response:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "errors": [
      "confidenceMin must be between 1 and 10",
      "Limit must be at most 100"
    ]
  }
}
```

**Note:** `offset=-10` is auto-corrected, not an error

---

## Error Handling Summary

### Client Errors (4xx)

| Status Code | Scenario | Example |
|------------|----------|---------|
| 400 Bad Request | Invalid parameters | Invalid category, confidence out of range |
| 404 Not Found | Route doesn't exist | `/api/decision` (typo) |
| 405 Method Not Allowed | Wrong HTTP method | DELETE on /api/decisions |

### Server Errors (5xx)

| Status Code | Scenario | Example |
|------------|----------|---------|
| 500 Internal Server Error | Database error, unexpected exception | Connection timeout, query error |
| 503 Service Unavailable | Database down | Supabase maintenance |

---

## Best Practices for Handling Edge Cases

### Frontend (React)

1. **Always Validate Before Sending:**
```typescript
if (!isValidSearchTerm(searchTerm)) {
  showError('Search term too long');
  return;
}
```

2. **Handle Empty Results:**
```typescript
{results.length === 0 && hasSearched && (
  <p>No decisions found. Try adjusting your filters.</p>
)}
```

3. **Handle Errors:**
```typescript
if (error) {
  return <ErrorBanner message={error} />;
}
```

4. **Debounce Search Input:**
```typescript
const debouncedSearch = useMemo(
  () => debounce(executeSearch, 300),
  [executeSearch]
);
```

---

### Backend (API)

1. **Validate Early:**
```typescript
const validation = validateSearchFilters(filters);
if (!validation.valid) {
  return validationErrorResponse(validation.errors);
}
```

2. **Log Errors:**
```typescript
catch (error) {
  console.error('Search error:', error);
  return handleApiError(error);
}
```

3. **Return Structured Errors:**
```typescript
{
  "success": false,
  "error": {
    "message": "User-friendly message",
    "code": "ERROR_CODE",
    "details": { field: "confidenceMin", value: 11 }
  }
}
```

---

## Testing Edge Cases

### Manual Testing Checklist

- [ ] Empty search returns all
- [ ] Very long search (500+ chars) rejected
- [ ] Special characters in search handled
- [ ] Invalid category rejected
- [ ] Empty tags array works
- [ ] Too many tags (> 20) rejected
- [ ] Duplicate tags deduplicated
- [ ] Confidence out of range rejected
- [ ] Min > Max confidence rejected
- [ ] Invalid outcome status rejected
- [ ] Negative offset auto-corrected
- [ ] Offset > total returns empty
- [ ] Limit > 100 capped
- [ ] Limit < 1 rejected
- [ ] Invalid sort rejected
- [ ] Relevance without search falls back
- [ ] All filters + no results returns empty
- [ ] SQL injection attempts safe
- [ ] Database connection error handled

### Automated Testing

Use `search-test-helpers.ts`:

```typescript
import { generateSearchTestCases, assertSearchResults } from '@/lib/api/search-test-helpers';

const testCases = generateSearchTestCases();

for (const testCase of testCases) {
  const results = await searchDecisions(testCase.filters);
  const validation = assertSearchResults(results, testCase);

  if (!validation.passed) {
    console.error(`Test failed: ${testCase.name}`, validation.errors);
  }
}
```

---

## Summary

### Key Takeaways

1. **Validation is Strict:** Invalid inputs are rejected early with clear error messages
2. **Auto-Correction Where Safe:** Negative offsets, oversized limits auto-corrected
3. **Security First:** SQL injection prevented via parameterized queries
4. **Graceful Degradation:** Empty results return empty array, not errors
5. **Performance Protected:** Limits on search term length, tag count, result size

### Edge Case Philosophy

- **Fail Fast:** Validate early, return clear errors
- **Be Forgiving:** Auto-correct when intent is clear (negative offset → 0)
- **Be Secure:** Never trust user input, always sanitize
- **Be Clear:** Error messages explain what's wrong and how to fix

---

## Need Help?

If you encounter an edge case not documented here:

1. Check server logs for detailed error messages
2. Verify input against validation rules
3. Test with minimal query first, then add complexity
4. File an issue with reproduction steps

---

## References

- [PostgreSQL Input Sanitization](https://www.postgresql.org/docs/current/sql-syntax-lexical.html)
- [Supabase Error Handling](https://supabase.com/docs/reference/javascript/error-handling)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
