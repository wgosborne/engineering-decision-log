// ============================================================================
// DECISION LOG - TYPESCRIPT TYPES
// ============================================================================
// Purpose: Type definitions for decision log data structures
// Usage: Import these types in components, API routes, and utilities
// Sync: Keep in sync with schema.sql when database schema changes
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Decision categories for classification
 * Matches: decision_category enum in schema.sql
 */
export enum DecisionCategory {
  Architecture = 'architecture',
  DataStorage = 'data-storage',
  ToolSelection = 'tool-selection',
  Process = 'process',
  ProjectManagement = 'project-management',
  Strategic = 'strategic',
  TechnicalDebt = 'technical-debt',
  Performance = 'performance',
  Security = 'security',
  Searching = 'searching',
  UI = 'ui',
  Other = 'other',
}

/**
 * Decision reversibility classification
 * Matches: decision_type enum in schema.sql
 */
export enum DecisionType {
  Reversible = 'reversible',
  SomewhatReversible = 'somewhat-reversible',
  Irreversible = 'irreversible',
}

/**
 * Optimization dimensions for tradeoff tracking
 * Matches: optimized_for_option enum in schema.sql
 */
export enum OptimizedFor {
  Speed = 'speed',
  Reliability = 'reliability',
  Cost = 'cost',
  Simplicity = 'simplicity',
  Scalability = 'scalability',
  Performance = 'performance',
  Learning = 'learning',
  Flexibility = 'flexibility',
  Security = 'security',
  Maintainability = 'maintainability',
}

// ============================================================================
// NESTED OBJECT TYPES (for JSONB fields)
// ============================================================================

/**
 * Represents a single option considered during decision-making
 * Stored in: options_considered (JSONB array)
 */
export interface DecisionOption {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
}

/**
 * Tracks relationship and comparison between related decisions
 * Stored in: similarity_notes (JSONB array)
 */
export interface SimilarityNote {
  related_decision_id: string; // UUID
  reason: string;
  comparison: string;
}

// ============================================================================
// MAIN DECISION INTERFACE
// ============================================================================

/**
 * Complete decision record
 * Matches: decisions table in schema.sql
 *
 * @example
 * const decision: Decision = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   title: 'Choose database for decision log',
 *   category: DecisionCategory.DataStorage,
 *   business_context: 'Need persistent storage for decision tracking',
 *   problem_statement: 'Select a database that supports full-text search',
 *   // ... other fields
 * }
 */
export interface Decision {
  // Primary Key & Timestamps
  id: string; // UUID
  date_created: string; // ISO-8601 timestamp
  date_updated: string; // ISO-8601 timestamp

  // Metadata
  title: string;
  project_name: string | null;
  category: DecisionCategory;
  tags: string[];
  notes: string | null;

  // Context
  business_context: string;
  problem_statement: string;
  stakeholders: string[];
  decision_type: DecisionType | null;

  // Decision Details
  options_considered: DecisionOption[];
  chosen_option: string | null;
  reasoning: string | null;
  confidence_level: number | null; // 1-10

  // Tradeoff Analysis
  tradeoffs_accepted: string[];
  tradeoffs_rejected: string[];
  optimized_for: OptimizedFor[];

  // Reflection & Review
  assumptions: string[];
  invalidation_conditions: string[];
  next_review_date: string | null; // ISO-8601 date
  revisit_reason: string | null;
  flagged_for_review: boolean;

  // Outcomes (filled in later)
  outcome: string | null;
  outcome_date: string | null; // ISO-8601 timestamp
  outcome_success: boolean | null;
  lessons_learned: string | null;

  // Relationships
  similar_decision_ids: string[]; // UUID[]
  related_decision_ids: string[]; // UUID[]
  similarity_notes: SimilarityNote[];

  // Full-text search (managed by database, typically not used in app)
  search_vector?: string;
}

// ============================================================================
// PARTIAL TYPES (for forms and API requests)
// ============================================================================

/**
 * Type for creating a new decision
 * Omits: id, date_created, date_updated (auto-generated)
 */
export type NewDecision = Omit<Decision, 'id' | 'date_created' | 'date_updated' | 'search_vector'>;

/**
 * Type for updating an existing decision
 * Makes all fields optional except id
 */
export type UpdateDecision = Partial<Omit<Decision, 'id' | 'date_created' | 'search_vector'>> & {
  id: string;
};

/**
 * Minimal decision data for list views
 * Used in: Decision list, search results, etc.
 */
export interface DecisionSummary {
  id: string;
  title: string;
  project_name: string | null;
  category: DecisionCategory;
  date_created: string;
  confidence_level: number | null;
  outcome_success: boolean | null;
  flagged_for_review: boolean;
  tags: string[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Response for decision list endpoint
 */
export type DecisionListResponse = ApiResponse<PaginatedResponse<DecisionSummary>>;

/**
 * Response for single decision endpoint
 */
export type DecisionDetailResponse = ApiResponse<Decision>;

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

/**
 * Filters for querying decisions
 * Used in: Search, filtering, analytics
 */
export interface DecisionFilters {
  category?: DecisionCategory[];
  project_name?: string[];
  tags?: string[];
  optimized_for?: OptimizedFor[];
  confidence_level_min?: number;
  confidence_level_max?: number;
  outcome_success?: boolean | null;
  flagged_for_review?: boolean;
  date_created_after?: string; // ISO-8601 date
  date_created_before?: string; // ISO-8601 date
  search_query?: string; // Full-text search
}

/**
 * Sort options for decision lists
 */
export interface DecisionSort {
  field: keyof Decision;
  direction: 'asc' | 'desc';
}

/**
 * Complete query parameters for decision list
 */
export interface DecisionQuery {
  filters?: DecisionFilters;
  sort?: DecisionSort;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Aggregated data for pattern analysis
 */
export interface OptimizationFrequency {
  optimized_for: OptimizedFor;
  frequency: number;
}

export interface CategorySuccessRate {
  decision_category: DecisionCategory;
  total: number;
  successful: number;
  success_rate: number;
}

export interface ConfidenceAnalysis {
  confidence_level: number;
  decisions: number;
  successful: number;
  success_rate: number;
}

export interface TradeoffAnalysis {
  tradeoff: string;
  frequency: number;
  successful_outcomes: number;
  success_rate: number;
}

export interface TrendData {
  week: string; // ISO-8601 date
  total_decisions: number;
  reliability_count: number;
  reliability_pct: number;
}

/**
 * Decision pending review
 */
export interface ReviewPending {
  id: string;
  title: string;
  project_name: string | null;
  next_review_date: string | null;
  flagged_for_review: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid DecisionCategory
 */
export function isDecisionCategory(value: string): value is DecisionCategory {
  return Object.values(DecisionCategory).includes(value as DecisionCategory);
}

/**
 * Type guard to check if a value is a valid OptimizedFor
 */
export function isOptimizedFor(value: string): value is OptimizedFor {
  return Object.values(OptimizedFor).includes(value as OptimizedFor);
}

/**
 * Type guard to check if a value is a valid DecisionType
 */
export function isDecisionType(value: string): value is DecisionType {
  return Object.values(DecisionType).includes(value as DecisionType);
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Converts enum to array of values for dropdown options
 */
export const DECISION_CATEGORIES = Object.values(DecisionCategory);
export const DECISION_TYPES = Object.values(DecisionType);
export const OPTIMIZED_FOR_OPTIONS = Object.values(OptimizedFor);

/**
 * Human-readable labels for categories
 */
export const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  [DecisionCategory.Architecture]: 'Architecture',
  [DecisionCategory.DataStorage]: 'Data Storage',
  [DecisionCategory.ToolSelection]: 'Tool Selection',
  [DecisionCategory.Process]: 'Process',
  [DecisionCategory.ProjectManagement]: 'Project Management',
  [DecisionCategory.Strategic]: 'Strategic',
  [DecisionCategory.TechnicalDebt]: 'Technical Debt',
  [DecisionCategory.Performance]: 'Performance',
  [DecisionCategory.Security]: 'Security',
  [DecisionCategory.Searching]: 'Searching',
  [DecisionCategory.UI]: 'UI',
  [DecisionCategory.Other]: 'Other',
};

/**
 * Human-readable labels for optimization dimensions
 */
export const OPTIMIZED_FOR_LABELS: Record<OptimizedFor, string> = {
  [OptimizedFor.Speed]: 'Speed',
  [OptimizedFor.Reliability]: 'Reliability',
  [OptimizedFor.Cost]: 'Cost',
  [OptimizedFor.Simplicity]: 'Simplicity',
  [OptimizedFor.Scalability]: 'Scalability',
  [OptimizedFor.Performance]: 'Performance',
  [OptimizedFor.Learning]: 'Learning',
  [OptimizedFor.Flexibility]: 'Flexibility',
  [OptimizedFor.Security]: 'Security',
  [OptimizedFor.Maintainability]: 'Maintainability',
};
