-- ============================================================================
-- SAMPLE DATA - DECISION LOG
-- ============================================================================
-- Purpose: Example decision record for testing database setup
-- Usage: Copy this entire file and paste into Supabase SQL Editor, then run
-- Note: This represents the actual decision to use Supabase for this project
-- ============================================================================

-- Sample Decision: Choosing Supabase as the database for Decision Log app
INSERT INTO decisions (
    -- Metadata
    title,
    project_name,
    category,
    tags,
    notes,

    -- Context
    business_context,
    problem_statement,
    stakeholders,
    decision_type,

    -- Decision Details
    options_considered,
    chosen_option,
    reasoning,
    confidence_level,

    -- Tradeoff Analysis
    tradeoffs_accepted,
    tradeoffs_rejected,
    optimized_for,

    -- Reflection
    assumptions,
    invalidation_conditions,
    next_review_date,
    revisit_reason,
    flagged_for_review,

    -- Outcomes (filled in 3 months later - example)
    outcome,
    outcome_date,
    outcome_success,
    lessons_learned
) VALUES (
    -- Metadata
    'Choose Supabase as database backend for Decision Log',
    'Decision Log App',
    'data-storage',
    ARRAY['postgres', 'supabase', 'backend', 'database', 'full-text-search'],
    'First major technical decision for this project. Need to balance learning goals with practical requirements.',

    -- Context
    'Building a personal decision tracking app to log ~50 decisions per month and analyze patterns over time. Need persistent storage with full-text search, date-based queries, and pattern analysis capabilities. Expected scale: ~600 decisions/year. This is both a learning project (practice prompting AI) and a real tool I''ll use daily.',

    'Need to select a database solution that supports:
    - Full-text search across decision content
    - Complex array and JSONB queries for pattern analysis
    - Low operational overhead (don''t want to manage infrastructure)
    - Free tier sufficient for personal use
    - Easy integration with Next.js
    - Good TypeScript support
    - Ability to run analytical queries for insights',

    ARRAY['Adam (developer and sole user)'],
    'somewhat-reversible',

    -- Decision Details (JSONB array of options)
    '[
        {
            "name": "Supabase (PostgreSQL)",
            "description": "Hosted PostgreSQL with built-in APIs, auth, and real-time subscriptions",
            "pros": [
                "Full PostgreSQL feature set (GIN indexes, full-text search, JSONB)",
                "Generous free tier (500MB storage, unlimited API requests)",
                "Excellent Next.js integration",
                "Auto-generated REST and GraphQL APIs",
                "Built-in authentication ready for future multi-user",
                "SQL editor in dashboard for running analytics queries",
                "Strong TypeScript support via generated types",
                "Real-time subscriptions if needed later",
                "Learning opportunity: PostgreSQL patterns"
            ],
            "cons": [
                "Vendor lock-in (though data export is easy)",
                "Slight learning curve for Supabase APIs",
                "Free tier has connection limits (not an issue for low traffic)",
                "Requires internet connection to access data"
            ]
        },
        {
            "name": "Firebase Firestore",
            "description": "NoSQL document database with real-time sync",
            "pros": [
                "Very easy to get started",
                "Generous free tier",
                "Excellent real-time capabilities",
                "Good Next.js integration",
                "Strong offline support"
            ],
            "cons": [
                "NoSQL limitations for complex analytical queries",
                "No full-text search (need Algolia integration)",
                "Query limitations (no array aggregations like UNNEST)",
                "More expensive at scale",
                "Less powerful for pattern analysis queries",
                "Not a transferable skill (Postgres is more universal)"
            ]
        },
        {
            "name": "Local SQLite + Turso",
            "description": "SQLite with edge replication via Turso",
            "pros": [
                "Extremely fast local queries",
                "Works offline",
                "Very generous free tier",
                "Simple schema"
            ],
            "cons": [
                "Limited full-text search compared to Postgres",
                "No JSONB type (must serialize to TEXT)",
                "Turso is newer/less proven",
                "More complex sync logic",
                "Limited array operations"
            ]
        },
        {
            "name": "PlanetScale (MySQL)",
            "description": "Hosted MySQL with branching",
            "pros": [
                "Generous free tier",
                "Database branching for dev/prod",
                "Good performance"
            ],
            "cons": [
                "MySQL has weaker full-text search than Postgres",
                "No native JSONB (JSON is less performant)",
                "No array types",
                "Less powerful for analytical queries",
                "Branching not needed for single-user app"
            ]
        }
    ]'::jsonb,

    'Supabase (PostgreSQL)',

    'Chose Supabase for several key reasons:

    1. **Query Power**: PostgreSQL''s GIN indexes, full-text search, and array operations are perfect for pattern analysis queries like "which tradeoffs do I accept most?" and "am I becoming more reliability-focused over time?"

    2. **Future-Proof**: Built-in auth and RLS make it easy to add multi-user support later if I want to share this tool.

    3. **Learning Value**: PostgreSQL skills transfer to many professional contexts. Understanding advanced features like tsvector, GIN indexes, and JSONB will be valuable.

    4. **Developer Experience**: SQL editor in dashboard lets me iterate on analytical queries quickly. Auto-generated TypeScript types reduce boilerplate.

    5. **Cost**: Free tier (500MB) easily handles 5000+ decisions with JSONB content. Won''t hit limits for years.

    6. **Analytical Queries**: Can write complex SQL for insights (window functions, CTEs, aggregations) that would be painful in NoSQL.

    The decision came down to Supabase vs Firebase. Firebase would be faster to start, but Postgres''s query capabilities are essential for the pattern analysis features that make this app valuable.',

    8, -- Confidence level

    -- Tradeoff Analysis
    ARRAY[
        'Vendor lock-in to Supabase',
        'Requires internet connection for data access',
        'Slightly steeper learning curve vs NoSQL',
        'Connection pooling complexity if scaling beyond free tier'
    ],

    ARRAY[
        'Firebase''s simpler API',
        'SQLite''s offline-first approach',
        'PlanetScale''s database branching'
    ],

    ARRAY['learning', 'flexibility', 'simplicity']::optimized_for_option[],

    -- Reflection
    ARRAY[
        'I will actually use this app regularly (not just build and abandon)',
        'Pattern analysis queries are the core value, not just CRUD',
        'Free tier is sufficient for personal use scale',
        'PostgreSQL skills remain relevant for 5+ years',
        'Supabase remains free and available'
    ],

    ARRAY[
        'App usage drops below 10 decisions/month for 3 consecutive months',
        'Supabase changes pricing model to make free tier unusable',
        'Pattern analysis queries become too slow (>1s) due to data volume',
        'Need offline-first capabilities for mobile app',
        'PostgreSQL complexity becomes barrier to rapid iteration'
    ],

    CURRENT_DATE + INTERVAL '3 months', -- Review in 3 months
    'Check if full-text search and pattern queries are performant with real data (~150 decisions by then). Evaluate if Supabase API complexity was worth it.',
    false,

    -- Outcomes (example of filling in later - would be NULL initially)
    'After 3 months of use, Supabase has been excellent. Full-text search is fast (<50ms), pattern queries work beautifully, and the SQL editor made iterating on analytics queries easy. GIN indexes handle array operations perfectly. The auto-generated TypeScript types saved hours of boilerplate. Free tier has zero performance issues with 180 decisions (~2MB data). Only minor issue: had to learn RLS policies, but this was valuable learning.',

    CURRENT_TIMESTAMP + INTERVAL '3 months', -- Outcome filled in 3 months later
    true,

    'Key learnings:

    1. **Invest in query power early**: The ability to write complex analytical SQL (with UNNEST, CTEs, window functions) has been invaluable. Would have been painful in Firebase.

    2. **GIN indexes are magic**: Full-text search and array queries that would be slow (>1s) are consistently <50ms thanks to GIN indexes.

    3. **PostgreSQL flexibility**: Being able to add new analytical queries without schema changes (thanks to JSONB) has enabled fast iteration on insights.

    4. **Free tier is generous**: 180 decisions with full JSONB content = ~2MB. Free tier (500MB) could easily handle 10+ years at current rate.

    5. **Learning value confirmed**: Understanding tsvector, GIN indexes, and advanced SQL has already paid dividends in work projects.

    **Would I make this decision again?** Absolutely. The only scenario where I''d choose differently is if I needed offline-first mobile app (would use SQLite + Turso), but that wasn''t a requirement.'
);

-- ============================================================================
-- VERIFY INSERT
-- ============================================================================

-- Check that the decision was inserted successfully
SELECT
    id,
    title,
    category,
    confidence_level,
    outcome_success,
    array_length(tags, 1) as tag_count,
    jsonb_array_length(options_considered) as options_count
FROM decisions
WHERE title LIKE '%Supabase%'
LIMIT 1;

-- Test full-text search
SELECT title, ts_rank(search_vector, query) as rank
FROM decisions, to_tsquery('english', 'postgres & full-text') query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- ============================================================================
-- ADDITIONAL SAMPLE DATA (Optional)
-- ============================================================================
-- Uncomment to add more example decisions for richer testing

/*
INSERT INTO decisions (
    title,
    project_name,
    category,
    tags,
    business_context,
    problem_statement,
    chosen_option,
    reasoning,
    confidence_level,
    optimized_for,
    tradeoffs_accepted,
    assumptions
) VALUES
(
    'Use Tailwind CSS with shadcn/ui components',
    'Decision Log App',
    'tool-selection',
    ARRAY['tailwind', 'shadcn', 'ui', 'css', 'components'],
    'Need a UI framework that enables rapid development while maintaining design consistency and accessibility.',
    'Choose CSS framework and component library for building decision log interface.',
    'Tailwind CSS + shadcn/ui',
    'Tailwind provides utility-first styling with excellent developer experience. Shadcn/ui provides pre-built accessible components that can be customized. Together they enable rapid UI development without heavy component library lock-in.',
    7,
    ARRAY['speed', 'flexibility', 'simplicity']::optimized_for_option[],
    ARRAY['Learning curve for Tailwind utility classes', 'More verbose HTML'],
    ARRAY['Tailwind skills remain relevant', 'Accessibility is important', 'Will need form components and data tables']
),
(
    'Implement decisions CRUD with Server Actions',
    'Decision Log App',
    'architecture',
    ARRAY['nextjs', 'server-actions', 'api', 'architecture'],
    'Next.js 14 supports Server Actions for data mutations without separate API routes.',
    'Decide between using Server Actions vs traditional API routes for decision CRUD operations.',
    'Server Actions',
    'Server Actions reduce boilerplate (no separate API routes), provide type safety between client and server, and simplify form handling. Since this is a primarily server-rendered app with progressive enhancement, Server Actions are a natural fit.',
    6,
    ARRAY['simplicity', 'maintainability']::optimized_for_option[],
    ARRAY['Newer Next.js pattern (less battle-tested)', 'Tighter coupling between UI and data layer'],
    ARRAY['Staying in Next.js ecosystem', 'Server-first architecture', 'Type safety is valuable']
);
*/

-- ============================================================================
-- CLEANUP (if you need to remove sample data)
-- ============================================================================

-- Uncomment to delete all sample decisions
-- DELETE FROM decisions WHERE project_name = 'Decision Log App';

-- ============================================================================
