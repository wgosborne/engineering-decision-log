-- ============================================================================
-- DECISION LOG - DATABASE SCHEMA
-- ============================================================================
-- Purpose: PostgreSQL schema for personal decision tracking and pattern analysis
-- Database: Supabase (PostgreSQL 15+)
-- Created: 2025-11-09
--
-- This schema supports:
-- - Full-text search across decision content
-- - Pattern analysis queries (confidence vs success, tradeoff analysis)
-- - Efficient filtering by category, project, tags, dates
-- - Relationship tracking between decisions
-- - Outcome tracking for learning from past decisions
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Decision categories for classification
CREATE TYPE decision_category AS ENUM (
    'architecture',
    'data-storage',
    'tool-selection',
    'process',
    'project-management',
    'strategic',
    'technical-debt',
    'performance',
    'security',
    'searching',
    'ui',
    'other'
);

-- Decision reversibility classification
CREATE TYPE decision_type AS ENUM (
    'reversible',
    'somewhat-reversible',
    'irreversible'
);

-- Optimization dimensions for tradeoff tracking
CREATE TYPE optimized_for_option AS ENUM (
    'speed',
    'reliability',
    'cost',
    'simplicity',
    'scalability',
    'performance',
    'learning',
    'flexibility',
    'security',
    'maintainability'
);

-- ============================================================================
-- MAIN DECISIONS TABLE
-- ============================================================================

CREATE TABLE decisions (
    -- Primary Key & Timestamps
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    title TEXT NOT NULL,
    project_name TEXT,
    category decision_category NOT NULL DEFAULT 'other',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,

    -- Context (Required for thoughtful decision-making)
    business_context TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    stakeholders TEXT[] DEFAULT '{}',
    decision_type decision_type DEFAULT 'reversible',

    -- Decision Details
    options_considered JSONB DEFAULT '[]',  -- Array of {name, description, pros[], cons[]}
    chosen_option TEXT,
    reasoning TEXT,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),

    -- Tradeoff Analysis
    tradeoffs_accepted TEXT[] DEFAULT '{}',
    tradeoffs_rejected TEXT[] DEFAULT '{}',
    optimized_for optimized_for_option[] DEFAULT '{}',

    -- Reflection & Review
    assumptions TEXT[] DEFAULT '{}',
    invalidation_conditions TEXT[] DEFAULT '{}',
    next_review_date DATE,
    revisit_reason TEXT,
    flagged_for_review BOOLEAN DEFAULT FALSE,

    -- Outcomes (Filled in later)
    outcome TEXT,
    outcome_date TIMESTAMPTZ,
    outcome_success BOOLEAN,
    lessons_learned TEXT,

    -- Relationships
    similar_decision_ids UUID[] DEFAULT '{}',
    related_decision_ids UUID[] DEFAULT '{}',
    similarity_notes JSONB DEFAULT '[]',  -- Array of {related_decision_id, reason, comparison}

    -- Full-text search vector (auto-populated via trigger)
    search_vector tsvector
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core filtering indexes
CREATE INDEX idx_decisions_category ON decisions(category);
CREATE INDEX idx_decisions_project_name ON decisions(project_name);
CREATE INDEX idx_decisions_date_created ON decisions(date_created DESC);
CREATE INDEX idx_decisions_confidence_level ON decisions(confidence_level);
CREATE INDEX idx_decisions_outcome_success ON decisions(outcome_success) WHERE outcome_success IS NOT NULL;

-- Review tracking indexes
CREATE INDEX idx_decisions_flagged_for_review ON decisions(flagged_for_review) WHERE flagged_for_review = TRUE;
CREATE INDEX idx_decisions_next_review_date ON decisions(next_review_date) WHERE next_review_date IS NOT NULL;

-- Array field indexes (GIN for efficient array operations)
CREATE INDEX idx_decisions_tags ON decisions USING GIN(tags);
CREATE INDEX idx_decisions_optimized_for ON decisions USING GIN(optimized_for);
CREATE INDEX idx_decisions_tradeoffs_accepted ON decisions USING GIN(tradeoffs_accepted);
CREATE INDEX idx_decisions_stakeholders ON decisions USING GIN(stakeholders);

-- JSONB indexes for complex queries
CREATE INDEX idx_decisions_options_considered ON decisions USING GIN(options_considered);
CREATE INDEX idx_decisions_similarity_notes ON decisions USING GIN(similarity_notes);

-- Full-text search index (GiST for tsvector)
CREATE INDEX idx_decisions_search_vector ON decisions USING GIN(search_vector);

-- Composite index for common date + category filtering
CREATE INDEX idx_decisions_date_category ON decisions(date_created DESC, category);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to auto-update date_updated timestamp
CREATE OR REPLACE FUNCTION update_updated_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update date_updated on every update
CREATE TRIGGER trigger_update_decisions_timestamp
    BEFORE UPDATE ON decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_timestamp();

-- Function to auto-populate full-text search vector
-- Note: Uses 'simple' config to avoid filtering stop words (have, the, is, etc.)
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.business_context, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.problem_statement, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.reasoning, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.chosen_option, '')), 'C') ||
        setweight(to_tsvector('simple', COALESCE(NEW.notes, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search_vector on insert or update
-- Note: Fires on ANY column update to keep search vector current
CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE
    ON decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- ============================================================================
-- HELPER VIEWS (Optional - for common queries)
-- ============================================================================

-- View: Recent decisions with key metadata
CREATE OR REPLACE VIEW recent_decisions AS
SELECT
    id,
    title,
    project_name,
    category,
    date_created,
    confidence_level,
    outcome_success,
    flagged_for_review
FROM decisions
ORDER BY date_created DESC
LIMIT 50;

-- View: Decisions pending review
CREATE OR REPLACE VIEW decisions_pending_review AS
SELECT
    id,
    title,
    project_name,
    next_review_date,
    flagged_for_review,
    date_created
FROM decisions
WHERE flagged_for_review = TRUE
   OR (next_review_date IS NOT NULL AND next_review_date <= CURRENT_DATE)
ORDER BY next_review_date ASC NULLS LAST;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - For future multi-user support
-- ============================================================================
-- Note: Currently disabled for single-user app
-- Uncomment when adding authentication

-- ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their own decisions"
--     ON decisions FOR SELECT
--     USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert their own decisions"
--     ON decisions FOR INSERT
--     WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update their own decisions"
--     ON decisions FOR UPDATE
--     USING (auth.uid() = user_id);

-- CREATE POLICY "Users can delete their own decisions"
--     ON decisions FOR DELETE
--     USING (auth.uid() = user_id);

-- ============================================================================
-- SAMPLE QUERY: Verify schema is working
-- ============================================================================
-- Run this after executing the schema to verify everything works:
--
-- SELECT
--     table_name,
--     column_name,
--     data_type,
--     is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'decisions'
-- ORDER BY ordinal_position;
--
-- ============================================================================
