# Database Indexes Explained

This document explains every index in the Decision Log database schema, why it exists, which queries benefit from it, and its performance characteristics.

## Quick Reference Table

| Index Name | Type | Column(s) | Primary Use Case | Query Speed Gain | Write Cost |
|------------|------|-----------|------------------|------------------|------------|
| `idx_decisions_category` | B-tree | category | Filter by category | 10-100x | Low |
| `idx_decisions_project_name` | B-tree | project_name | Filter by project | 10-100x | Low |
| `idx_decisions_date_created` | B-tree | date_created DESC | Sort/filter by date | 10-100x | Low |
| `idx_decisions_confidence_level` | B-tree | confidence_level | Confidence analysis | 5-50x | Low |
| `idx_decisions_outcome_success` | B-tree (partial) | outcome_success | Success rate queries | 5-20x | Very Low |
| `idx_decisions_flagged_for_review` | B-tree (partial) | flagged_for_review | Review dashboard | 10-50x | Very Low |
| `idx_decisions_next_review_date` | B-tree (partial) | next_review_date | Upcoming reviews | 10-50x | Very Low |
| `idx_decisions_tags` | GIN | tags | Search by tags | 20-200x | Medium |
| `idx_decisions_optimized_for` | GIN | optimized_for | Tradeoff analysis | 20-200x | Medium |
| `idx_decisions_tradeoffs_accepted` | GIN | tradeoffs_accepted | Tradeoff queries | 20-200x | Medium |
| `idx_decisions_stakeholders` | GIN | stakeholders | Filter by stakeholder | 20-200x | Medium |
| `idx_decisions_options_considered` | GIN | options_considered | Search options | 20-200x | Medium |
| `idx_decisions_similarity_notes` | GIN | similarity_notes | Relationship queries | 20-200x | Medium |
| `idx_decisions_search_vector` | GIN | search_vector | Full-text search | 50-500x | Medium |
| `idx_decisions_date_category` | B-tree (composite) | date_created, category | Combined filters | 20-100x | Low |

## Index Details

---

### 1. `idx_decisions_category`
**Type:** B-tree
**Column:** `category`

**Purpose:**
Speed up filtering and grouping by decision category.

**Queries That Benefit:**
```sql
-- Filter by category
SELECT * FROM decisions WHERE category = 'architecture';

-- Group by category (success rate analysis)
SELECT category, COUNT(*)
FROM decisions
GROUP BY category;
```

**Performance:**
- **Before index:** Full table scan (~50-1000ms for 500 decisions)
- **After index:** Index scan (~1-5ms)
- **Improvement:** 10-100x faster

**Maintenance Cost:**
- **Insert/Update:** Negligible (~0.1ms overhead)
- **Storage:** ~50KB per 1000 decisions

**When It's Used:**
- Decision list filtered by category
- Category success rate analysis
- Category frequency charts

---

### 2. `idx_decisions_project_name`
**Type:** B-tree
**Column:** `project_name`

**Purpose:**
Enable fast filtering of decisions by project.

**Queries That Benefit:**
```sql
-- View all decisions for a project
SELECT * FROM decisions WHERE project_name = 'Decision Log App';

-- Count decisions per project
SELECT project_name, COUNT(*)
FROM decisions
GROUP BY project_name;
```

**Performance:**
- **Before:** Full scan (~50-1000ms)
- **After:** Index scan (~1-5ms)
- **Improvement:** 10-100x

**Maintenance Cost:**
- **Insert/Update:** Low (~0.1ms)
- **Storage:** ~100KB per 1000 decisions (text values)

---

### 3. `idx_decisions_date_created`
**Type:** B-tree (DESC)
**Column:** `date_created`

**Purpose:**
Optimize sorting by date (most recent first) and date range filtering.

**Queries That Benefit:**
```sql
-- Show recent decisions (most common query)
SELECT * FROM decisions ORDER BY date_created DESC LIMIT 20;

-- Decisions in last 3 months
SELECT * FROM decisions
WHERE date_created > NOW() - INTERVAL '3 months';

-- Weekly trend analysis
SELECT DATE_TRUNC('week', date_created), COUNT(*)
FROM decisions
GROUP BY DATE_TRUNC('week', date_created);
```

**Performance:**
- **Before:** Full scan + sort (~100-2000ms)
- **After:** Index scan (~1-10ms)
- **Improvement:** 10-200x

**Special Note:**
Created with `DESC` order because most queries sort newest first.

---

### 4. `idx_decisions_confidence_level`
**Type:** B-tree
**Column:** `confidence_level`

**Purpose:**
Enable confidence-based analysis queries.

**Queries That Benefit:**
```sql
-- "Do higher-confidence decisions succeed more often?"
SELECT
  confidence_level,
  COUNT(*) as total,
  COUNT(CASE WHEN outcome_success = true THEN 1 END) as successful
FROM decisions
WHERE outcome_success IS NOT NULL
GROUP BY confidence_level;

-- Filter by confidence threshold
SELECT * FROM decisions WHERE confidence_level >= 8;
```

**Performance:**
- **Before:** Full scan (~30-500ms)
- **After:** Index scan (~1-5ms)
- **Improvement:** 5-50x

---

### 5. `idx_decisions_outcome_success` (Partial Index)
**Type:** B-tree (partial)
**Column:** `outcome_success`
**Condition:** `WHERE outcome_success IS NOT NULL`

**Purpose:**
Optimize queries that analyze outcomes, ignoring decisions without outcomes yet.

**Queries That Benefit:**
```sql
-- Success rate by category
SELECT category,
  COUNT(*) as total,
  COUNT(CASE WHEN outcome_success = true THEN 1 END) as successful
FROM decisions
WHERE outcome_success IS NOT NULL
GROUP BY category;

-- Show only successful/failed decisions
SELECT * FROM decisions WHERE outcome_success = true;
```

**Performance:**
- **Before:** Full scan (~30-500ms)
- **After:** Partial index scan (~1-3ms)
- **Improvement:** 5-20x

**Special Note:**
Partial index only stores rows where `outcome_success IS NOT NULL`, making it smaller and faster. Since most queries analyzing outcomes already filter out NULL values, this is very efficient.

**Storage Savings:**
- Full index would be ~50KB per 1000 decisions
- Partial index is ~20KB (assuming 40% of decisions have outcomes)

---

### 6. `idx_decisions_flagged_for_review` (Partial Index)
**Type:** B-tree (partial)
**Column:** `flagged_for_review`
**Condition:** `WHERE flagged_for_review = TRUE`

**Purpose:**
Super-fast lookup for decisions flagged for review (review dashboard).

**Queries That Benefit:**
```sql
-- Review dashboard
SELECT * FROM decisions WHERE flagged_for_review = TRUE;

-- Combined with other filters
SELECT * FROM decisions
WHERE flagged_for_review = TRUE
  AND category = 'architecture';
```

**Performance:**
- **Before:** Full scan (~50-500ms)
- **After:** Partial index scan (<1ms)
- **Improvement:** 10-50x

**Special Note:**
Partial index only stores flagged decisions (likely <5% of total), making lookups extremely fast.

---

### 7. `idx_decisions_next_review_date` (Partial Index)
**Type:** B-tree (partial)
**Column:** `next_review_date`
**Condition:** `WHERE next_review_date IS NOT NULL`

**Purpose:**
Quick lookup for upcoming review dates.

**Queries That Benefit:**
```sql
-- Decisions due for review soon
SELECT * FROM decisions
WHERE next_review_date IS NOT NULL
  AND next_review_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY next_review_date;

-- Overdue reviews
SELECT * FROM decisions
WHERE next_review_date < CURRENT_DATE;
```

**Performance:**
- **Before:** Full scan + sort (~50-500ms)
- **After:** Partial index scan (~1-5ms)
- **Improvement:** 10-50x

---

### 8. `idx_decisions_tags` (GIN Index)
**Type:** GIN (Generalized Inverted Index)
**Column:** `tags` (array)

**Purpose:**
Enable fast searching within tag arrays.

**Queries That Benefit:**
```sql
-- Find decisions with specific tag
SELECT * FROM decisions WHERE tags @> ARRAY['postgres'];

-- Find decisions with any of these tags
SELECT * FROM decisions WHERE tags && ARRAY['database', 'performance'];

-- Count decisions per tag
SELECT unnest(tags) as tag, COUNT(*)
FROM decisions
GROUP BY tag;
```

**Performance:**
- **Before:** Sequential scan checking each array (~100-2000ms)
- **After:** GIN index lookup (~1-10ms)
- **Improvement:** 20-200x

**How GIN Works:**
- Creates inverted index: `tag_value -> [decision_ids]`
- Very fast for array containment checks
- Efficient for OR queries (multiple tags)

**Maintenance Cost:**
- **Insert/Update:** Medium (~1-5ms overhead)
- **Storage:** ~200KB per 1000 decisions (depends on tag uniqueness)

---

### 9. `idx_decisions_optimized_for` (GIN Index)
**Type:** GIN
**Column:** `optimized_for` (array of enums)

**Purpose:**
Enable pattern analysis: "What do I optimize for most?"

**Queries That Benefit:**
```sql
-- "Am I becoming more reliability-focused over time?"
SELECT
  DATE_TRUNC('week', date_created) as week,
  COUNT(*) as total,
  COUNT(CASE WHEN 'reliability' = ANY(optimized_for) THEN 1 END) as reliability_count
FROM decisions
GROUP BY week;

-- Find decisions optimizing for speed
SELECT * FROM decisions WHERE optimized_for @> ARRAY['speed']::optimized_for_option[];
```

**Performance:**
- **Before:** Full scan (~100-2000ms)
- **After:** GIN lookup (~1-10ms)
- **Improvement:** 20-200x

---

### 10. `idx_decisions_tradeoffs_accepted` (GIN Index)
**Type:** GIN
**Column:** `tradeoffs_accepted` (array)

**Purpose:**
Enable tradeoff analysis queries.

**Queries That Benefit:**
```sql
-- "Which tradeoffs do I accept most? Which ones pay off?"
SELECT
  UNNEST(tradeoffs_accepted) as tradeoff,
  COUNT(*) as frequency,
  COUNT(CASE WHEN outcome_success = true THEN 1 END) as successful
FROM decisions
WHERE outcome_success IS NOT NULL
GROUP BY tradeoff;

-- Find decisions accepting specific tradeoff
SELECT * FROM decisions
WHERE tradeoffs_accepted @> ARRAY['increased complexity'];
```

**Performance:**
- **Before:** Full scan (~100-2000ms)
- **After:** GIN lookup (~1-10ms)
- **Improvement:** 20-200x

---

### 11. `idx_decisions_stakeholders` (GIN Index)
**Type:** GIN
**Column:** `stakeholders` (array)

**Purpose:**
Find decisions involving specific stakeholders.

**Queries That Benefit:**
```sql
-- All decisions involving a stakeholder
SELECT * FROM decisions WHERE stakeholders @> ARRAY['Adam'];

-- Count decisions per stakeholder
SELECT unnest(stakeholders) as person, COUNT(*)
FROM decisions
GROUP BY person;
```

**Performance:**
- **Improvement:** 20-200x over full scan

---

### 12. `idx_decisions_options_considered` (GIN Index)
**Type:** GIN
**Column:** `options_considered` (JSONB)

**Purpose:**
Enable searching within considered options (name, description, pros, cons).

**Queries That Benefit:**
```sql
-- Find decisions that considered a specific option
SELECT * FROM decisions
WHERE options_considered @> '[{"name": "PostgreSQL"}]'::jsonb;

-- Search within option descriptions
SELECT * FROM decisions
WHERE options_considered::text ILIKE '%performance%';
```

**Performance:**
- **Before:** Full scan + JSON parsing (~200-3000ms)
- **After:** GIN lookup (~2-20ms)
- **Improvement:** 20-200x

**How JSONB GIN Works:**
- Indexes all keys and values in JSONB
- Supports containment operators (@>, @<, ??, etc.)
- Very fast for structural searches

---

### 13. `idx_decisions_similarity_notes` (GIN Index)
**Type:** GIN
**Column:** `similarity_notes` (JSONB)

**Purpose:**
Enable queries about related decisions.

**Queries That Benefit:**
```sql
-- Find decisions related to a specific decision
SELECT * FROM decisions
WHERE similarity_notes @> '[{"related_decision_id": "abc-123"}]'::jsonb;

-- Search similarity reasons
SELECT * FROM decisions
WHERE similarity_notes::text ILIKE '%similar architecture%';
```

**Performance:**
- **Improvement:** 20-200x

---

### 14. `idx_decisions_search_vector` (GIN Index)
**Type:** GIN
**Column:** `search_vector` (tsvector)

**Purpose:**
Full-text search across title, business_context, reasoning, chosen_option, notes.

**Queries That Benefit:**
```sql
-- Search for keywords
SELECT * FROM decisions
WHERE search_vector @@ to_tsquery('english', 'database & performance');

-- Ranked search results
SELECT *, ts_rank(search_vector, query) as rank
FROM decisions, to_tsquery('english', 'postgres | mysql') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

**Performance:**
- **Before:** Full scan + string matching (~500-5000ms)
- **After:** GIN full-text search (~5-50ms)
- **Improvement:** 50-500x

**How It Works:**
- Automatically updated by trigger when text fields change
- Uses English language stemming (run → running → ran all match)
- Supports Boolean operators (AND, OR, NOT)
- Weighted by field importance (title > context > notes)

**Maintenance:**
- Auto-updated by trigger (no manual work needed)
- Overhead: ~2-5ms per insert/update

---

### 15. `idx_decisions_date_category` (Composite Index)
**Type:** B-tree (composite)
**Columns:** `date_created DESC, category`

**Purpose:**
Optimize queries that filter/sort by date AND category together.

**Queries That Benefit:**
```sql
-- Recent decisions in specific category
SELECT * FROM decisions
WHERE category = 'architecture'
ORDER BY date_created DESC
LIMIT 20;

-- Category trends over time
SELECT DATE_TRUNC('month', date_created), category, COUNT(*)
FROM decisions
GROUP BY DATE_TRUNC('month', date_created), category;
```

**Performance:**
- **Before:** Must use both indexes or full scan (~20-200ms)
- **After:** Single composite index scan (~1-10ms)
- **Improvement:** 20-100x

**When It's Used:**
- Dashboard filtering (category + recent)
- Trend analysis by category
- Combined filters are very common

---

## Index Strategy Summary

### B-tree Indexes (6 indexes)
**Best for:** Exact matches, ranges, sorting
**Use cases:** Dates, categories, confidence levels
**Cost:** Low insert/update overhead

### GIN Indexes (8 indexes)
**Best for:** Arrays, JSONB, full-text search
**Use cases:** Tags, options, full-text search
**Cost:** Medium insert/update overhead

### Partial Indexes (3 indexes)
**Best for:** Sparse data (few TRUE values, few non-NULL values)
**Use cases:** Flagged items, outcome tracking
**Cost:** Very low (only indexes subset of rows)

## Performance Testing

To verify index usage, use `EXPLAIN ANALYZE`:

```sql
EXPLAIN ANALYZE
SELECT * FROM decisions WHERE category = 'architecture';
```

**Look for:**
- ✅ "Index Scan using idx_decisions_category" (good!)
- ❌ "Seq Scan on decisions" (bad - not using index)

## When Indexes Aren't Used

PostgreSQL may skip indexes if:
1. **Table is very small** (<100 rows) - full scan is faster
2. **Query returns >10% of rows** - full scan is more efficient
3. **Statistics are outdated** - run `ANALYZE decisions;`
4. **Column has low cardinality** - few unique values

## Maintenance

### Update Statistics (run monthly or after bulk inserts)
```sql
ANALYZE decisions;
```

### Check Index Bloat (run quarterly)
```sql
SELECT schemaname, tablename, indexname,
       pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename = 'decisions'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Rebuild Bloated Indexes (if needed)
```sql
REINDEX INDEX CONCURRENTLY idx_decisions_search_vector;
```

## Cost-Benefit Analysis

### Total Storage Cost
- **15 indexes** × **~50-200KB each** = **~1-3MB** for 1000 decisions
- Negligible compared to data size (~5-10MB)

### Total Write Overhead
- **~5-15ms per INSERT** (spread across all indexes)
- Acceptable for decision logging (not high-frequency writes)

### Read Performance Gains
- **10-500x faster queries** (depending on index type)
- Essential for pattern analysis and search

**Verdict:** Indexes are well worth the cost for this use case.

## Further Reading

- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [GIN Indexes Explained](https://www.postgresql.org/docs/current/gin.html)
- [Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
