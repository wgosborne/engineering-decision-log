# Useful Queries - Decision Log

This document contains ready-to-run SQL queries for analyzing your decision-making patterns. Copy these into the Supabase SQL Editor to gain insights from your decision data.

---

## Table of Contents
1. [Pattern Discovery Queries](#pattern-discovery-queries)
2. [Filtering & Search Queries](#filtering--search-queries)
3. [Time-Based Analysis](#time-based-analysis)
4. [Review & Follow-Up Queries](#review--follow-up-queries)
5. [Data Quality Queries](#data-quality-queries)
6. [Export & Reporting Queries](#export--reporting-queries)

---

## Pattern Discovery Queries

These queries help you understand patterns in your decision-making process.

### 1. What Do I Optimize For Most?

**Question:** Which optimization dimensions do I prioritize most frequently?

```sql
SELECT
    UNNEST(optimized_for) AS dimension,
    COUNT(*) AS frequency,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM decisions WHERE optimized_for IS NOT NULL AND array_length(optimized_for, 1) > 0), 2) AS percentage
FROM decisions
WHERE date_created > NOW() - INTERVAL '3 months'
  AND optimized_for IS NOT NULL
  AND array_length(optimized_for, 1) > 0
GROUP BY dimension
ORDER BY frequency DESC;
```

**Expected Output:**
| dimension | frequency | percentage |
|-----------|-----------|------------|
| simplicity | 28 | 35.00 |
| speed | 22 | 27.50 |
| reliability | 18 | 22.50 |

**What to look for:**
- Are you consistently optimizing for the same dimensions?
- Does this align with your stated priorities?
- Are you neglecting important dimensions (e.g., security, maintainability)?

---

### 2. Which Categories Have the Highest Success Rate?

**Question:** Do certain types of decisions succeed more often than others?

```sql
SELECT
    category AS decision_category,
    COUNT(*) AS total_decisions,
    COUNT(CASE WHEN outcome_success = true THEN 1 END) AS successful,
    COUNT(CASE WHEN outcome_success = false THEN 1 END) AS failed,
    ROUND(100.0 * COUNT(CASE WHEN outcome_success = true THEN 1 END) / COUNT(*), 2) AS success_rate
FROM decisions
WHERE outcome_success IS NOT NULL
GROUP BY category
ORDER BY success_rate DESC;
```

**Expected Output:**
| decision_category | total_decisions | successful | failed | success_rate |
|-------------------|-----------------|------------|--------|--------------|
| tool-selection | 12 | 11 | 1 | 91.67 |
| architecture | 8 | 6 | 2 | 75.00 |
| hiring | 5 | 3 | 2 | 60.00 |

**What to look for:**
- Which decision types are you strongest at?
- Where do you need to improve your process?
- Are low success rates due to category difficulty or your approach?

---

### 3. Am I Becoming More Reliability-Focused Over Time?

**Question:** How has my optimization focus shifted over time?

```sql
SELECT
    DATE_TRUNC('week', date_created) AS week,
    COUNT(*) AS total_decisions,
    COUNT(CASE WHEN 'reliability' = ANY(optimized_for) THEN 1 END) AS reliability_count,
    ROUND(100.0 * COUNT(CASE WHEN 'reliability' = ANY(optimized_for) THEN 1 END) / COUNT(*), 2) AS reliability_percentage
FROM decisions
WHERE optimized_for IS NOT NULL
GROUP BY DATE_TRUNC('week', date_created)
ORDER BY week DESC
LIMIT 12;  -- Last 12 weeks
```

**Variation: Track Multiple Dimensions**
```sql
SELECT
    DATE_TRUNC('month', date_created) AS month,
    COUNT(*) AS total_decisions,
    COUNT(CASE WHEN 'reliability' = ANY(optimized_for) THEN 1 END) AS reliability,
    COUNT(CASE WHEN 'speed' = ANY(optimized_for) THEN 1 END) AS speed,
    COUNT(CASE WHEN 'cost' = ANY(optimized_for) THEN 1 END) AS cost,
    COUNT(CASE WHEN 'simplicity' = ANY(optimized_for) THEN 1 END) AS simplicity
FROM decisions
GROUP BY DATE_TRUNC('month', date_created)
ORDER BY month DESC
LIMIT 6;  -- Last 6 months
```

**What to look for:**
- Are you shifting priorities over time?
- Do trends align with life changes (new job, new project phase)?
- Are you becoming more balanced or more specialized?

---

### 4. Do Higher-Confidence Decisions Succeed More Often?

**Question:** Is confidence a good predictor of success?

```sql
SELECT
    confidence_level,
    COUNT(*) AS total_decisions,
    COUNT(CASE WHEN outcome_success = true THEN 1 END) AS successful,
    COUNT(CASE WHEN outcome_success = false THEN 1 END) AS failed,
    ROUND(100.0 * COUNT(CASE WHEN outcome_success = true THEN 1 END) / COUNT(*), 2) AS success_rate
FROM decisions
WHERE outcome_success IS NOT NULL
  AND confidence_level IS NOT NULL
GROUP BY confidence_level
ORDER BY confidence_level DESC;
```

**Expected Output:**
| confidence_level | total_decisions | successful | failed | success_rate |
|------------------|-----------------|------------|--------|--------------|
| 10 | 3 | 3 | 0 | 100.00 |
| 9 | 8 | 7 | 1 | 87.50 |
| 8 | 15 | 12 | 3 | 80.00 |
| 7 | 12 | 8 | 4 | 66.67 |

**What to look for:**
- Is your confidence well-calibrated?
- Are low-confidence decisions failing as expected?
- Are you overconfident (high confidence but low success)?
- Are you underconfident (low confidence but high success)?

---

### 5. Which Tradeoffs Do I Accept Most? Which Ones Pay Off?

**Question:** What compromises do I make most often, and do they lead to success?

```sql
SELECT
    UNNEST(tradeoffs_accepted) AS tradeoff,
    COUNT(*) AS frequency,
    COUNT(CASE WHEN outcome_success = true THEN 1 END) AS successful_outcomes,
    COUNT(CASE WHEN outcome_success = false THEN 1 END) AS failed_outcomes,
    ROUND(100.0 * COUNT(CASE WHEN outcome_success = true THEN 1 END) / COUNT(*), 2) AS success_rate
FROM decisions
WHERE outcome_success IS NOT NULL
  AND tradeoffs_accepted IS NOT NULL
  AND array_length(tradeoffs_accepted, 1) > 0
GROUP BY tradeoff
ORDER BY frequency DESC
LIMIT 20;
```

**Expected Output:**
| tradeoff | frequency | successful_outcomes | failed_outcomes | success_rate |
|----------|-----------|---------------------|-----------------|--------------|
| Increased complexity | 18 | 14 | 4 | 77.78 |
| Higher initial cost | 12 | 10 | 2 | 83.33 |
| Vendor lock-in | 10 | 7 | 3 | 70.00 |

**What to look for:**
- Which tradeoffs are worth accepting?
- Are certain tradeoffs consistently problematic?
- Do you accept the same tradeoffs repeatedly?

---

### 6. Show Me Decisions I Should Revisit Soon

**Question:** What decisions need review?

```sql
SELECT
    id,
    title,
    project_name,
    category,
    date_created,
    next_review_date,
    flagged_for_review,
    CASE
        WHEN flagged_for_review = TRUE THEN 'Flagged for review'
        WHEN next_review_date < CURRENT_DATE THEN 'Overdue'
        WHEN next_review_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Due this week'
        ELSE 'Due soon'
    END AS urgency
FROM decisions
WHERE flagged_for_review = TRUE
   OR (next_review_date IS NOT NULL AND next_review_date <= CURRENT_DATE + INTERVAL '30 days')
ORDER BY
    CASE
        WHEN flagged_for_review = TRUE THEN 1
        WHEN next_review_date < CURRENT_DATE THEN 2
        WHEN next_review_date <= CURRENT_DATE + INTERVAL '7 days' THEN 3
        ELSE 4
    END,
    next_review_date ASC NULLS LAST;
```

**What to look for:**
- Decisions you flagged for follow-up
- Scheduled reviews coming up
- Overdue reviews

---

## Filtering & Search Queries

### Full-Text Search Across All Content

```sql
-- Simple search
SELECT
    id,
    title,
    category,
    project_name,
    date_created
FROM decisions
WHERE search_vector @@ to_tsquery('english', 'postgres & performance');

-- Ranked search (best matches first)
SELECT
    id,
    title,
    category,
    ts_rank(search_vector, query) AS rank
FROM decisions, to_tsquery('english', 'postgres | firebase | mysql') query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
```

**Search Operators:**
- `&` = AND (both terms must appear)
- `|` = OR (either term can appear)
- `!` = NOT (exclude term)
- Example: `postgres & (performance | speed) & !mysql`

---

### Filter by Multiple Tags

```sql
-- Decisions with ALL these tags
SELECT title, tags
FROM decisions
WHERE tags @> ARRAY['postgres', 'performance'];

-- Decisions with ANY of these tags
SELECT title, tags
FROM decisions
WHERE tags && ARRAY['postgres', 'mysql', 'mongodb'];

-- Decisions with specific tag
SELECT title, tags
FROM decisions
WHERE 'postgres' = ANY(tags);
```

---

### Filter by Date Range

```sql
-- Last 30 days
SELECT title, date_created
FROM decisions
WHERE date_created > NOW() - INTERVAL '30 days'
ORDER BY date_created DESC;

-- Specific date range
SELECT title, date_created
FROM decisions
WHERE date_created BETWEEN '2025-01-01' AND '2025-03-31'
ORDER BY date_created DESC;

-- This year
SELECT title, date_created
FROM decisions
WHERE date_created >= DATE_TRUNC('year', CURRENT_DATE)
ORDER BY date_created DESC;
```

---

### Filter by Project and Category

```sql
SELECT
    title,
    category,
    project_name,
    date_created
FROM decisions
WHERE project_name = 'Decision Log App'
  AND category = 'data-storage'
ORDER BY date_created DESC;
```

---

### Find Similar Decisions

```sql
-- Find decisions related to a specific decision
SELECT
    d1.title AS current_decision,
    d2.title AS related_decision,
    d2.category,
    d2.date_created
FROM decisions d1
CROSS JOIN LATERAL UNNEST(d1.similar_decision_ids) AS related_id
JOIN decisions d2 ON d2.id = related_id
WHERE d1.id = 'YOUR_DECISION_ID_HERE';

-- Find decisions in same category with similar tags
SELECT
    d2.title,
    d2.tags,
    d2.date_created
FROM decisions d1
JOIN decisions d2 ON d1.category = d2.category
WHERE d1.id = 'YOUR_DECISION_ID_HERE'
  AND d2.id != d1.id
  AND d2.tags && d1.tags  -- Has overlapping tags
ORDER BY d2.date_created DESC
LIMIT 10;
```

---

## Time-Based Analysis

### Decisions Per Month

```sql
SELECT
    DATE_TRUNC('month', date_created) AS month,
    COUNT(*) AS decision_count,
    COUNT(CASE WHEN outcome_success = true THEN 1 END) AS successful,
    COUNT(CASE WHEN outcome_success = false THEN 1 END) AS failed
FROM decisions
GROUP BY DATE_TRUNC('month', date_created)
ORDER BY month DESC
LIMIT 12;
```

---

### Busiest Decision-Making Periods

```sql
SELECT
    DATE_TRUNC('week', date_created) AS week,
    COUNT(*) AS decision_count,
    STRING_AGG(DISTINCT category::TEXT, ', ') AS categories
FROM decisions
GROUP BY DATE_TRUNC('week', date_created)
ORDER BY decision_count DESC
LIMIT 10;
```

---

### Average Time to Outcome

```sql
SELECT
    category,
    COUNT(*) AS decisions_with_outcomes,
    ROUND(AVG(EXTRACT(EPOCH FROM (outcome_date - date_created)) / 86400), 1) AS avg_days_to_outcome,
    MIN(outcome_date - date_created) AS fastest,
    MAX(outcome_date - date_created) AS slowest
FROM decisions
WHERE outcome_date IS NOT NULL
  AND date_created IS NOT NULL
GROUP BY category
ORDER BY avg_days_to_outcome;
```

---

## Review & Follow-Up Queries

### Decisions Without Outcomes (Need Follow-Up)

```sql
SELECT
    id,
    title,
    category,
    date_created,
    ROUND(EXTRACT(EPOCH FROM (NOW() - date_created)) / 86400) AS days_since_decision
FROM decisions
WHERE outcome_success IS NULL
  AND date_created < NOW() - INTERVAL '90 days'  -- Older than 90 days
ORDER BY date_created ASC
LIMIT 20;
```

---

### Most Impactful Decisions (by length of reasoning)

```sql
SELECT
    title,
    category,
    confidence_level,
    outcome_success,
    LENGTH(reasoning) AS reasoning_length,
    LENGTH(lessons_learned) AS lessons_length
FROM decisions
WHERE reasoning IS NOT NULL
ORDER BY reasoning_length DESC
LIMIT 10;
```

---

### Decisions with Invalidation Conditions

```sql
SELECT
    title,
    category,
    date_created,
    invalidation_conditions,
    outcome_success
FROM decisions
WHERE invalidation_conditions IS NOT NULL
  AND array_length(invalidation_conditions, 1) > 0
ORDER BY date_created DESC;
```

---

## Data Quality Queries

### Find Incomplete Decisions

```sql
-- Missing key fields
SELECT
    id,
    title,
    CASE
        WHEN reasoning IS NULL OR LENGTH(reasoning) < 50 THEN 'Missing reasoning'
        WHEN confidence_level IS NULL THEN 'Missing confidence'
        WHEN chosen_option IS NULL THEN 'Missing chosen option'
        WHEN array_length(tradeoffs_accepted, 1) IS NULL THEN 'Missing tradeoffs'
        ELSE 'OK'
    END AS missing_field
FROM decisions
WHERE reasoning IS NULL OR LENGTH(reasoning) < 50
   OR confidence_level IS NULL
   OR chosen_option IS NULL
   OR array_length(tradeoffs_accepted, 1) IS NULL
ORDER BY date_created DESC;
```

---

### Decisions with No Tags

```sql
SELECT
    id,
    title,
    category,
    date_created
FROM decisions
WHERE tags IS NULL OR array_length(tags, 1) IS NULL
ORDER BY date_created DESC;
```

---

### Outliers: Very High or Low Confidence

```sql
-- Very confident decisions (10/10) - are they actually succeeding?
SELECT
    title,
    category,
    confidence_level,
    outcome_success,
    date_created
FROM decisions
WHERE confidence_level >= 9
ORDER BY date_created DESC;

-- Low confidence decisions (1-3) - why so uncertain?
SELECT
    title,
    category,
    confidence_level,
    outcome_success,
    date_created
FROM decisions
WHERE confidence_level <= 3
ORDER BY date_created DESC;
```

---

## Export & Reporting Queries

### Monthly Summary Report

```sql
SELECT
    DATE_TRUNC('month', date_created) AS month,
    COUNT(*) AS total_decisions,
    COUNT(DISTINCT category) AS categories_covered,
    COUNT(DISTINCT project_name) AS projects,
    ROUND(AVG(confidence_level), 2) AS avg_confidence,
    COUNT(CASE WHEN outcome_success = true THEN 1 END) AS successful,
    COUNT(CASE WHEN outcome_success = false THEN 1 END) AS failed,
    COUNT(CASE WHEN outcome_success IS NULL THEN 1 END) AS pending_outcome
FROM decisions
GROUP BY DATE_TRUNC('month', date_created)
ORDER BY month DESC
LIMIT 12;
```

---

### Category Breakdown

```sql
SELECT
    category,
    COUNT(*) AS total,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM decisions), 2) AS percentage,
    ROUND(AVG(confidence_level), 2) AS avg_confidence,
    COUNT(CASE WHEN outcome_success = true THEN 1 END) AS successful,
    COUNT(CASE WHEN outcome_success = false THEN 1 END) AS failed
FROM decisions
GROUP BY category
ORDER BY total DESC;
```

---

### Top Projects by Decision Count

```sql
SELECT
    project_name,
    COUNT(*) AS decision_count,
    MIN(date_created) AS first_decision,
    MAX(date_created) AS latest_decision,
    COUNT(CASE WHEN outcome_success = true THEN 1 END) AS successful
FROM decisions
WHERE project_name IS NOT NULL
GROUP BY project_name
ORDER BY decision_count DESC
LIMIT 20;
```

---

### Most Used Tags

```sql
SELECT
    UNNEST(tags) AS tag,
    COUNT(*) AS frequency
FROM decisions
WHERE tags IS NOT NULL
GROUP BY tag
ORDER BY frequency DESC
LIMIT 30;
```

---

### Export to CSV (for external analysis)

```sql
-- Basic export
COPY (
    SELECT
        id,
        title,
        category,
        project_name,
        date_created,
        confidence_level,
        outcome_success,
        chosen_option
    FROM decisions
    ORDER BY date_created DESC
) TO '/tmp/decisions_export.csv' WITH CSV HEADER;
```

**Note:** In Supabase SQL Editor, you can't write to file system. Instead:
1. Run the SELECT query
2. Click "Download as CSV" button in results panel

---

## Advanced Analytics Queries

### Confidence Calibration Analysis

**Are you well-calibrated?** Compare predicted confidence vs actual success rate.

```sql
WITH confidence_buckets AS (
    SELECT
        CASE
            WHEN confidence_level >= 9 THEN '9-10 (Very High)'
            WHEN confidence_level >= 7 THEN '7-8 (High)'
            WHEN confidence_level >= 5 THEN '5-6 (Medium)'
            WHEN confidence_level >= 3 THEN '3-4 (Low)'
            ELSE '1-2 (Very Low)'
        END AS confidence_bucket,
        outcome_success
    FROM decisions
    WHERE confidence_level IS NOT NULL
      AND outcome_success IS NOT NULL
)
SELECT
    confidence_bucket,
    COUNT(*) AS total,
    COUNT(CASE WHEN outcome_success = true THEN 1 END) AS successful,
    ROUND(100.0 * COUNT(CASE WHEN outcome_success = true THEN 1 END) / COUNT(*), 2) AS success_rate,
    CASE
        WHEN confidence_bucket = '9-10 (Very High)' AND ROUND(100.0 * COUNT(CASE WHEN outcome_success = true THEN 1 END) / COUNT(*), 2) >= 85 THEN 'Well calibrated'
        WHEN confidence_bucket = '7-8 (High)' AND ROUND(100.0 * COUNT(CASE WHEN outcome_success = true THEN 1 END) / COUNT(*), 2) BETWEEN 65 AND 85 THEN 'Well calibrated'
        WHEN confidence_bucket = '5-6 (Medium)' AND ROUND(100.0 * COUNT(CASE WHEN outcome_success = true THEN 1 END) / COUNT(*), 2) BETWEEN 45 AND 65 THEN 'Well calibrated'
        WHEN ROUND(100.0 * COUNT(CASE WHEN outcome_success = true THEN 1 END) / COUNT(*), 2) > 85 THEN 'Underconfident'
        ELSE 'Overconfident'
    END AS calibration
FROM confidence_buckets
GROUP BY confidence_bucket
ORDER BY confidence_bucket;
```

---

### Decision Velocity by Category

**How fast do you make decisions in each category?**

```sql
WITH decision_gaps AS (
    SELECT
        category,
        date_created,
        LAG(date_created) OVER (PARTITION BY category ORDER BY date_created) AS prev_decision_date
    FROM decisions
)
SELECT
    category,
    COUNT(*) AS total_decisions,
    ROUND(AVG(EXTRACT(EPOCH FROM (date_created - prev_decision_date)) / 86400), 1) AS avg_days_between_decisions,
    MIN(date_created - prev_decision_date) AS fastest_gap,
    MAX(date_created - prev_decision_date) AS longest_gap
FROM decision_gaps
WHERE prev_decision_date IS NOT NULL
GROUP BY category
ORDER BY avg_days_between_decisions;
```

---

## How to Run These Queries

### In Supabase SQL Editor

1. Open your Supabase project dashboard
2. Click **"SQL Editor"** in left sidebar
3. Click **"New query"**
4. Copy/paste any query from this document
5. Replace placeholder values (like `YOUR_DECISION_ID_HERE`)
6. Click **"Run"** or press `Ctrl+Enter`
7. View results in the panel below
8. Click **"Download as CSV"** to export results

### In Your Application (TypeScript)

```typescript
import { supabase } from '@/lib/supabase/client';

// Example: Get optimization frequency
const { data, error } = await supabase.rpc('optimization_frequency', {
  months: 3
});

// Note: For complex queries, consider creating database functions
// or using the Supabase JavaScript client's query builder
```

---

## Creating Your Own Queries

**Tips:**
1. Start simple, add complexity incrementally
2. Use `EXPLAIN ANALYZE` to check performance
3. Test with `LIMIT 10` before running on full dataset
4. Use CTEs (WITH clauses) for complex multi-step queries
5. Create views for frequently-run queries

**Example CTE Query:**
```sql
WITH recent_decisions AS (
    SELECT * FROM decisions
    WHERE date_created > NOW() - INTERVAL '90 days'
),
successful_decisions AS (
    SELECT * FROM recent_decisions
    WHERE outcome_success = true
)
SELECT
    category,
    COUNT(*) as successful_count
FROM successful_decisions
GROUP BY category;
```

---

## Further Reading

- [PostgreSQL Aggregate Functions](https://www.postgresql.org/docs/current/functions-aggregate.html)
- [Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html)
- [Full-Text Search Queries](https://www.postgresql.org/docs/current/textsearch-intro.html)
- [Array Functions](https://www.postgresql.org/docs/current/functions-array.html)
