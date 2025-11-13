# Database Design Decisions

This document explains the architectural choices made in the Decision Log database schema. Each decision represents a tradeoff, and understanding the "why" helps you extend the schema intelligently.

---

## Table of Contents
1. [ARRAY vs JSONB](#array-vs-jsonb)
2. [ENUM Types vs CHECK Constraints](#enum-types-vs-check-constraints)
3. [Full-Text Search Configuration](#full-text-search-configuration)
4. [Index Strategy](#index-strategy)
5. [Timestamp Defaults](#timestamp-defaults)
6. [Partial Indexes](#partial-indexes)
7. [Triggers vs Application Logic](#triggers-vs-application-logic)
8. [Row-Level Security (RLS)](#row-level-security-rls)
9. [UUID vs Serial IDs](#uuid-vs-serial-ids)
10. [Normalization vs Denormalization](#normalization-vs-denormalization)
11. [Scalability Considerations](#scalability-considerations)

---

## ARRAY vs JSONB

### Question
When should we use PostgreSQL `ARRAY` types vs `JSONB` for list-like data?

### Decision
- **Simple string lists** → `TEXT[]` arrays
  - Examples: `tags`, `stakeholders`, `tradeoffs_accepted`, `assumptions`
- **Complex nested objects** → `JSONB`
  - Examples: `options_considered`, `similarity_notes`

### Rationale

**ARRAY (TEXT[]) is better when:**
- Data is a simple list of strings
- Order doesn't matter (or is preserved naturally)
- Need efficient filtering: `tags @> ARRAY['postgres']`
- Want to unnest for aggregations: `SELECT unnest(tags) FROM decisions`
- Storage is more compact (~50% less than JSONB for strings)

**JSONB is better when:**
- Data has nested structure (objects with multiple fields)
- Need to query specific fields: `options_considered @> '[{"name": "Firebase"}]'`
- Schema might evolve (can add fields without migration)
- Want JSON validation and indexing

### Example

```sql
-- ARRAY: Simple list
tags TEXT[] = ['postgres', 'database', 'backend']

-- JSONB: Complex structure
options_considered JSONB = [
  {
    "name": "Option A",
    "description": "...",
    "pros": ["fast", "cheap"],
    "cons": ["complex"]
  }
]
```

### Alternatives Considered
1. **Store as TEXT with comma separation** - Rejected: Can't efficiently query, no type safety
2. **Separate join tables** - Rejected: Over-normalized for personal app, slower queries, more complex schema
3. **Everything as JSONB** - Rejected: Overkill for simple lists, harder to query

---

## ENUM Types vs CHECK Constraints

### Question
Should we use PostgreSQL `ENUM` types or `CHECK` constraints for categorical data?

### Decision
**Use ENUM types** for: `decision_category`, `decision_type`, `optimized_for_option`

### Rationale

**ENUM Advantages:**
- Type safety at database level
- Auto-complete in SQL editors
- Storage efficient (stored as integers internally)
- Clear documentation of valid values
- TypeScript types can be generated from enums

**CHECK Constraint Disadvantages:**
- No IDE auto-complete
- Stored as full text (larger)
- Easy to typo without catching at DB level

**ENUM Disadvantages:**
- Schema migration required to add/remove values
- Can't easily share enums across tables (must create multiple types)

### Why This Works for Us
- Categories are relatively stable (won't change often)
- When we do add categories, a migration is acceptable
- Type safety prevents bugs (e.g., typo 'arcitecture' instead of 'architecture')

### How to Add New Values

```sql
-- Add new category
ALTER TYPE decision_category ADD VALUE 'compliance';

-- Add new optimization dimension
ALTER TYPE optimized_for_option ADD VALUE 'compliance';
```

**Note:** You can add values, but removing them requires recreating the type (more complex).

### Alternative Considered
**CHECK constraints:**
```sql
category TEXT CHECK (category IN ('architecture', 'data-storage', ...))
```
Rejected because: no type safety, no auto-complete, error-prone.

---

## Full-Text Search Configuration

### Question
How should we implement full-text search across multiple fields?

### Decision
- Use `tsvector` column with automatic trigger updates
- Use weighted search (title > context > notes)
- Use English language configuration
- GIN index for performance

### Rationale

**Why tsvector column vs on-the-fly?**
```sql
-- On-the-fly (slow)
SELECT * FROM decisions
WHERE to_tsvector('english', title || ' ' || business_context) @@ to_tsquery('postgres');

-- Pre-computed tsvector (fast)
SELECT * FROM decisions
WHERE search_vector @@ to_tsquery('postgres');
```

**Tradeoff:**
- **Pro:** 50-500x faster queries (GIN index only works on tsvector column)
- **Pro:** Can weight fields differently (title matches rank higher)
- **Con:** Extra storage (~10-20% of text size)
- **Con:** Slight insert/update overhead (~2-5ms)

### Weighting Strategy
```sql
setweight(to_tsvector('english', title), 'A') ||           -- Highest weight
setweight(to_tsvector('english', business_context), 'B') || -- High weight
setweight(to_tsvector('english', reasoning), 'B') ||       -- High weight
setweight(to_tsvector('english', chosen_option), 'C') ||   -- Medium weight
setweight(to_tsvector('english', notes), 'D')              -- Low weight
```

This means searching for "postgres" in the title ranks higher than in notes.

### Why English Configuration?
- Includes stemming: "run", "running", "ran" all match
- Removes stop words: "the", "a", "is" ignored
- Supports Boolean operators: `postgres & (performance | speed)`

**Alternative:** Could use `simple` configuration (no stemming) if you want exact matches only.

### Automatic Updates via Trigger
The trigger ensures `search_vector` stays in sync:
```sql
CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE OF title, business_context, ...
    ON decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();
```

**Why trigger vs application logic?**
- Can't forget to update search_vector
- Works even with direct SQL inserts
- Atomic with the main operation

---

## Index Strategy

### Question
Which indexes should we create, and which should we skip?

### Decision
**15 indexes total:**
- 6 B-tree indexes (standard columns)
- 8 GIN indexes (arrays, JSONB, full-text)
- 3 partial indexes (sparse data)
- 1 composite index (common combined filter)

### Rationale

**General Strategy:**
1. **Index columns in WHERE clauses** - category, project_name, dates
2. **Index arrays/JSONB** - tags, optimized_for (for containment queries)
3. **Partial indexes for sparse data** - flagged_for_review, outcome_success
4. **Composite for common combinations** - date + category

**What we DON'T index:**
- `title` - full-text search covers this
- `notes` - full-text search covers this
- `confidence_level` - wait, we DO index this for analytics!
- `chosen_option` - full-text search covers this
- Low-cardinality enums without filtering use case

### Over-Indexing vs Under-Indexing

**Signs of over-indexing:**
- Slow inserts (>50ms for simple decision)
- Index size > table size
- Indexes never used (check `pg_stat_user_indexes`)

**Signs of under-indexing:**
- Common queries take >100ms
- `EXPLAIN` shows "Seq Scan" for filtered queries
- Analytics dashboard is slow

**Our Position:** Slightly over-indexed for read-heavy workload.
- ~50 decisions/month = ~1-2 inserts per day
- ~10-50 reads per day (viewing decisions, analytics)
- Write cost (~5-15ms) is acceptable for read gains (10-500x)

### Testing Index Usage
```sql
-- Check if index is being used
EXPLAIN ANALYZE
SELECT * FROM decisions WHERE category = 'architecture';

-- Should see: "Index Scan using idx_decisions_category"
-- Not: "Seq Scan on decisions"
```

See `docs/INDEXES_EXPLAINED.md` for detailed index documentation.

---

## Timestamp Defaults

### Question
Should timestamps auto-populate or require explicit values?

### Decision
- `date_created`: `DEFAULT NOW()` - auto-set on insert
- `date_updated`: `DEFAULT NOW()` + trigger - auto-set on insert/update

### Rationale

**Why auto-populate?**
- Can't forget to set (eliminates entire class of bugs)
- Consistent across all inserts (no timezone issues)
- Audit trail is automatic

**Why trigger for date_updated?**
- Ensures it updates on every change (can't forget)
- Even direct SQL updates are tracked
- Application doesn't need to remember to set it

### Trigger Implementation
```sql
CREATE FUNCTION update_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Alternative Considered:** Application-level timestamp management
- Rejected: Easy to forget, inconsistent across API routes, doesn't work for SQL editor updates

---

## Partial Indexes

### Question
When should we use partial indexes (with WHERE clause)?

### Decision
**Use partial indexes for sparse data:**
- `outcome_success WHERE outcome_success IS NOT NULL`
- `flagged_for_review WHERE flagged_for_review = TRUE`
- `next_review_date WHERE next_review_date IS NOT NULL`

### Rationale

**Example:**
```sql
-- Full index
CREATE INDEX idx_outcome ON decisions(outcome_success);
-- Size: ~50KB per 1000 decisions

-- Partial index
CREATE INDEX idx_outcome ON decisions(outcome_success)
WHERE outcome_success IS NOT NULL;
-- Size: ~20KB per 1000 decisions (assuming 40% have outcomes)
```

**Benefits:**
- **Smaller index** → faster lookups, less storage
- **Faster writes** → only updates index for relevant rows
- **Better query plans** → planner knows index is selective

**When to use:**
- Data is sparse (<50% of rows have value)
- Queries almost always filter on the same condition
- Example: Most decisions don't have outcomes yet, so most queries filter `WHERE outcome_success IS NOT NULL`

**When NOT to use:**
- Data is dense (>80% of rows)
- Queries often need full data (including NULLs)

---

## Triggers vs Application Logic

### Question
Should we use database triggers or handle logic in application code?

### Decision
**Use triggers for:**
- `date_updated` auto-update
- `search_vector` auto-update

**Application logic for:**
- Business rules (validation beyond DB constraints)
- Complex calculations
- External API calls

### Rationale

**Triggers are better when:**
- Logic must ALWAYS run (audit trails, search indexes)
- Logic is simple (timestamp updates, vector updates)
- Need to work with direct SQL access (SQL editor)

**Application logic is better when:**
- Logic is complex (multi-step business rules)
- Need to call external services (APIs)
- Want flexibility to change without migrations
- Need better testing/debugging

**Our Triggers:**
1. **update_updated_timestamp** - Simple, must always run
2. **update_search_vector** - Simple, must stay in sync, pure SQL

**What we DON'T do in triggers:**
- Validation (use CHECK constraints or app logic)
- Complex calculations (use app logic)
- Cross-table updates (use app logic for clarity)

---

## Row-Level Security (RLS)

### Question
Should we enable PostgreSQL Row-Level Security (RLS)?

### Decision
**Disabled for now**, but schema is ready for multi-user.

### Rationale

**Current state (single-user app):**
```sql
-- RLS is OFF
-- All queries work without user context
```

**Future state (multi-user):**
```sql
-- Add user_id column
ALTER TABLE decisions ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Policy: Users see only their decisions
CREATE POLICY "Users view own decisions"
ON decisions FOR SELECT
USING (auth.uid() = user_id);
```

**Why wait?**
- Single-user app doesn't need RLS complexity
- Can add later without schema changes (except user_id column)
- Easier development/debugging without RLS

**When to enable:**
- Adding authentication
- Sharing app with others
- Multi-tenant SaaS version

---

## UUID vs Serial IDs

### Question
Should we use UUIDs or auto-incrementing integers for primary keys?

### Decision
**Use UUIDs** (`gen_random_uuid()`)

### Rationale

**UUID Advantages:**
- **No coordination needed** - can generate IDs client-side
- **Merge-friendly** - no ID conflicts when merging databases
- **Security** - can't enumerate decisions by guessing IDs (1, 2, 3...)
- **Distributed-ready** - multiple clients/servers can generate IDs

**UUID Disadvantages:**
- Larger storage (16 bytes vs 4 bytes for INT)
- Slightly slower joins (rare in our app)
- Not human-readable

**Why This Works for Us:**
- Future-proof for potential features (offline mode, mobile app)
- API security benefit (can't guess IDs)
- Storage cost is negligible (~12KB per 1000 decisions)

**Alternative Considered:**
```sql
id SERIAL PRIMARY KEY  -- Auto-incrementing integer
```
Rejected because: exposes decision count, harder to merge data, less secure.

---

## Normalization vs Denormalization

### Question
Should we normalize data (separate tables) or denormalize (store in same table)?

### Decision
**Denormalized (single table)** with JSONB/arrays for nested data.

### Rationale

**Fully Normalized Schema (rejected):**
```sql
-- decisions table
-- options table (foreign key to decisions)
-- pros table (foreign key to options)
-- cons table (foreign key to options)
-- tags table
-- decisions_tags junction table
-- stakeholders table
-- decisions_stakeholders junction table
-- ... 10+ tables
```

**Denormalized Schema (chosen):**
```sql
-- decisions table with JSONB/arrays
```

**Why Denormalization Wins Here:**

1. **Query Performance:**
   - Single table scan vs 5-10 joins
   - All data in one row (no cross-table queries)
   - Simpler queries → easier to write, faster to execute

2. **Schema Simplicity:**
   - 1 table vs 10+ tables
   - Easier to understand
   - Fewer migrations

3. **Data Locality:**
   - Decision with all details loads in one query
   - No N+1 query problems
   - Better cache efficiency

4. **Use Case Fit:**
   - Decisions are always viewed/edited as complete units
   - Rarely need to query just options or just pros
   - No need to share options across decisions

**When Normalization Would Be Better:**
- Shared reference data (e.g., standardized tags across users)
- Need to enforce referential integrity across entities
- Frequently query child entities independently
- Multi-user with shared data

**Our Denormalization Strategy:**
- `options_considered`: JSONB array (each decision's options are unique)
- `tags`: TEXT array (personal tags, not shared across users)
- `stakeholders`: TEXT array (names, not user entities)

---

## Scalability Considerations

### Question
How far can this schema scale, and what are the limits?

### Decision
**Optimized for: 5,000-10,000 decisions** (10-20 years of personal use)

### Performance Characteristics

| Decisions | Table Size | Index Size | Query Time | Insert Time |
|-----------|------------|------------|------------|-------------|
| 100       | ~500KB     | ~1MB       | <5ms       | ~5ms        |
| 1,000     | ~5MB       | ~10MB      | <10ms      | ~10ms       |
| 10,000    | ~50MB      | ~100MB     | <20ms      | ~15ms       |
| 100,000   | ~500MB     | ~1GB       | <50ms      | ~20ms       |

**Supabase Free Tier:**
- 500MB database storage
- Handles ~5,000-10,000 decisions comfortably
- ~600 decisions/year = 8+ years before limit

### Optimization Strategies

**If you hit scale limits:**

1. **Partition by date:**
   ```sql
   -- Split into yearly tables
   CREATE TABLE decisions_2025 PARTITION OF decisions
   FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
   ```

2. **Archive old decisions:**
   ```sql
   -- Move decisions older than 5 years to archive table
   CREATE TABLE decisions_archive AS
   SELECT * FROM decisions WHERE date_created < NOW() - INTERVAL '5 years';
   ```

3. **Optimize JSONB storage:**
   ```sql
   -- Use JSONB compression
   ALTER TABLE decisions SET (toast_tuple_target = 128);
   ```

4. **Add caching layer:**
   - Redis for frequently accessed decisions
   - Pre-compute analytics queries

### When to Consider Re-Architecture

**Warning signs:**
- Query times consistently >500ms
- Insert times >100ms
- Running out of free tier storage
- Need real multi-tenancy (separate schemas per user)

**Solutions:**
- Move to paid tier (connection pooling, more resources)
- Implement archival strategy
- Add read replicas for analytics
- Consider time-series database for analytics

### Current Bottlenecks

**Not bottlenecks (designed for):**
- ✅ Full-text search (~5-50ms with GIN indexes)
- ✅ Pattern analysis queries (~10-100ms)
- ✅ Array operations (~5-20ms with GIN indexes)

**Potential future bottlenecks:**
- ⚠️ Large JSONB fields (>100KB per decision)
- ⚠️ Complex similarity queries across 10,000+ decisions
- ⚠️ Real-time full-text search with faceting

---

## Summary: Key Design Principles

1. **Optimize for reads over writes** - 50:1 read-to-write ratio
2. **Denormalize for simplicity** - Single table, JSONB/arrays for nested data
3. **Index generously** - Read-heavy workload justifies 15 indexes
4. **Auto-populate metadata** - Triggers for timestamps and search vectors
5. **Type safety at DB level** - ENUMs prevent typos, constraints ensure data quality
6. **Future-proof architecture** - Ready for auth, multi-user, offline mode
7. **PostgreSQL-native features** - Full-text search, GIN indexes, array operations

---

## Questions for Future Consideration

1. **If going multi-user:** Add `user_id`, enable RLS, separate schemas per user?
2. **If adding mobile app:** Offline sync strategy (CRDTs, conflict resolution)?
3. **If analytics become slow:** Separate analytics database (data warehouse)?
4. **If decision content grows:** External blob storage for attachments?

---

## Further Reading

- [PostgreSQL Array Documentation](https://www.postgresql.org/docs/current/arrays.html)
- [JSONB vs JSON in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Indexing Best Practices](https://www.postgresql.org/docs/current/indexes.html)
- [Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
