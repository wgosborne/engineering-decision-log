// ============================================================================
// SEARCH TYPES
// ============================================================================
// Purpose: TypeScript types for search and filter operations
// Usage: Import in search components, hooks, and API handlers
// ============================================================================

import { Decision, DecisionCategory } from './decisions';

// ============================================================================
// SEARCH FILTER TYPES
// ============================================================================

/**
 * Search and filter parameters for querying decisions
 */
export interface SearchFilters {
  // Full-text search
  search?: string;

  // Category filter
  category?: DecisionCategory;

  // Project filter
  project?: string;

  // Tag filter (match ANY of these tags)
  tags?: string[];

  // Confidence level range
  confidenceMin?: number;
  confidenceMax?: number;

  // Outcome status filter
  outcomeStatus?: 'all' | 'pending' | 'success' | 'failed';

  // Flagged for review filter
  flagged?: boolean;

  // Sorting
  sort?: SortOption;

  // Pagination
  limit?: number;
  offset?: number;
}

/**
 * Available sort options
 */
export type SortOption =
  | 'date-desc'      // Most recent first (default)
  | 'date-asc'       // Oldest first
  | 'confidence-desc' // Highest confidence first
  | 'confidence-asc'  // Lowest confidence first
  | 'relevance';     // Best search match first (only with search term)

// ============================================================================
// SEARCH RESPONSE TYPES
// ============================================================================

/**
 * Response from search endpoint with results and metadata
 */
export interface SearchResponse {
  // Results
  decisions: Decision[];

  // Pagination metadata
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;

  // Filter options (for populating dropdowns)
  metadata: SearchMetadata;
}

/**
 * Metadata about available filter options
 */
export interface SearchMetadata {
  // Distinct categories present in results
  availableCategories: DecisionCategory[];

  // Distinct projects present in results
  availableProjects: string[];

  // Distinct tags present in results
  availableTags: string[];

  // Confidence range in results
  confidenceRange?: {
    min: number;
    max: number;
  };

  // Outcome statistics
  outcomeStats?: {
    total: number;
    pending: number;
    success: number;
    failed: number;
  };
}

// ============================================================================
// FILTER VALIDATION TYPES
// ============================================================================

/**
 * Result of filter validation
 */
export interface FilterValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: any;
}

/**
 * Validation error details
 */
export interface SearchValidationError {
  field: string;
  message: string;
  received?: any;
}

// ============================================================================
// SEARCH STATE TYPES (for React hooks)
// ============================================================================

/**
 * Search state for React hook
 */
export interface SearchState {
  // Current filters
  filters: SearchFilters;

  // Results
  results: Decision[];
  total: number;
  hasMore: boolean;

  // Metadata
  metadata: SearchMetadata;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Has search been executed at least once
  hasSearched: boolean;
}

/**
 * Search actions for React hook
 */
export interface SearchActions {
  // Set individual filters
  setSearchTerm: (term: string) => void;
  setCategory: (category: DecisionCategory | undefined) => void;
  setProject: (project: string | undefined) => void;
  setTags: (tags: string[]) => void;
  setConfidenceRange: (min?: number, max?: number) => void;
  setOutcomeStatus: (status: SearchFilters['outcomeStatus']) => void;
  setFlagged: (flagged: boolean | undefined) => void;
  setSort: (sort: SortOption) => void;

  // Pagination
  setLimit: (limit: number) => void;
  setOffset: (offset: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  // Bulk operations
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;

  // Execute search
  executeSearch: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// QUERY BUILDER TYPES
// ============================================================================

/**
 * SQL query parts for building Supabase queries
 */
export interface QueryParts {
  whereClauses: string[];
  params: any[];
  orderBy: string;
  limit: number;
  offset: number;
}

/**
 * Full-text search configuration
 */
export interface FullTextSearchConfig {
  // Fields to search (with weights)
  fields: {
    field: string;
    weight: 'A' | 'B' | 'C' | 'D';
  }[];

  // Language configuration
  language: 'english';

  // Use plainto_tsquery (more forgiving) vs to_tsquery (strict)
  queryType: 'plain' | 'phrase' | 'websearch';
}

// ============================================================================
// SEARCH SUMMARY TYPES
// ============================================================================

/**
 * Human-readable summary of active filters
 */
export interface SearchSummary {
  // Active filter count
  activeFilterCount: number;

  // Human-readable description
  description: string;

  // Individual filter descriptions
  filters: {
    type: string;
    label: string;
    value: string;
  }[];
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Type guard to check if sort option is valid
 */
export function isValidSortOption(value: string): value is SortOption {
  return ['date-desc', 'date-asc', 'confidence-desc', 'confidence-asc', 'relevance'].includes(
    value
  );
}

/**
 * Type guard to check if outcome status is valid
 */
export function isValidOutcomeStatus(
  value: string
): value is 'all' | 'pending' | 'success' | 'failed' {
  return ['all', 'pending', 'success', 'failed'].includes(value);
}

/**
 * Default search filters
 */
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  sort: 'date-desc',
  limit: 20,
  offset: 0,
  outcomeStatus: 'all',
};

/**
 * Maximum values for validation
 */
export const SEARCH_LIMITS = {
  MAX_LIMIT: 100,
  MAX_SEARCH_LENGTH: 500,
  MAX_TAG_COUNT: 20,
} as const;

// ============================================================================
// EXPORTS
// ============================================================================
// All types are already exported via `export interface` statements above
