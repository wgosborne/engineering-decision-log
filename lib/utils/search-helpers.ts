// ============================================================================
// SEARCH HELPER UTILITIES
// ============================================================================
// Purpose: Frontend utility functions for search display and formatting
// Usage: Import in components that display search results or filters
// ============================================================================

import {
  SearchFilters,
  SearchSummary,
  DEFAULT_SEARCH_FILTERS,
} from '@/lib/types/search';
import { CATEGORY_LABELS } from '@/lib/types/decisions';

// ============================================================================
// SEARCH SUMMARY
// ============================================================================

/**
 * Generate human-readable summary of active filters
 * Example: "Showing architecture decisions with tags [learning, database]"
 */
export function getSearchSummary(filters: SearchFilters): SearchSummary {
  const activeFilters: SearchSummary['filters'] = [];
  let activeFilterCount = 0;

  // Search term
  if (filters.search) {
    activeFilters.push({
      type: 'search',
      label: 'Search',
      value: `"${filters.search}"`,
    });
    activeFilterCount++;
  }

  // Category
  if (filters.category) {
    const categoryLabel = CATEGORY_LABELS[filters.category] || filters.category;
    activeFilters.push({
      type: 'category',
      label: 'Category',
      value: categoryLabel,
    });
    activeFilterCount++;
  }

  // Project
  if (filters.project) {
    activeFilters.push({
      type: 'project',
      label: 'Project',
      value: filters.project,
    });
    activeFilterCount++;
  }

  // Tags
  if (filters.tags && filters.tags.length > 0) {
    activeFilters.push({
      type: 'tags',
      label: 'Tags',
      value: filters.tags.join(', '),
    });
    activeFilterCount++;
  }

  // Confidence range
  if (filters.confidenceMin !== undefined || filters.confidenceMax !== undefined) {
    const min = filters.confidenceMin || 1;
    const max = filters.confidenceMax || 10;
    activeFilters.push({
      type: 'confidence',
      label: 'Confidence',
      value: `${min}-${max}`,
    });
    activeFilterCount++;
  }

  // Outcome status
  if (filters.outcomeStatus && filters.outcomeStatus !== 'all') {
    const statusLabels = {
      pending: 'Pending outcome',
      success: 'Successful',
      failed: 'Failed',
    };
    activeFilters.push({
      type: 'outcome',
      label: 'Outcome',
      value: statusLabels[filters.outcomeStatus],
    });
    activeFilterCount++;
  }

  // Flagged
  if (filters.flagged !== undefined) {
    activeFilters.push({
      type: 'flagged',
      label: 'Flagged',
      value: filters.flagged ? 'Yes' : 'No',
    });
    activeFilterCount++;
  }

  // Build description
  let description = 'Showing all decisions';

  if (activeFilterCount > 0) {
    const filterDescriptions = activeFilters.map((f) => `${f.label}: ${f.value}`);
    description = `Showing decisions with ${filterDescriptions.join(', ')}`;
  }

  return {
    activeFilterCount,
    description,
    filters: activeFilters,
  };
}

/**
 * Check if any filters are currently active
 */
export function areFiltersApplied(filters: SearchFilters): boolean {
  const defaultFilters = DEFAULT_SEARCH_FILTERS;

  return (
    !!filters.search ||
    !!filters.category ||
    !!filters.project ||
    (filters.tags && filters.tags.length > 0) ||
    filters.confidenceMin !== defaultFilters.confidenceMin ||
    filters.confidenceMax !== defaultFilters.confidenceMax ||
    (filters.outcomeStatus && filters.outcomeStatus !== 'all') ||
    filters.flagged !== undefined
  );
}

// ============================================================================
// FILTER FORMATTING
// ============================================================================

/**
 * Format search term for display
 * Truncates long search terms with ellipsis
 */
export function formatSearchTerm(term: string | undefined, maxLength: number = 50): string {
  if (!term) return '';

  const trimmed = term.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.substring(0, maxLength)}...`;
}

/**
 * Format tags for display
 * Example: ["tag1", "tag2", "tag3"] → "tag1, tag2, +1 more"
 */
export function formatTags(tags: string[] | undefined, maxDisplay: number = 3): string {
  if (!tags || tags.length === 0) return '';

  if (tags.length <= maxDisplay) {
    return tags.join(', ');
  }

  const displayed = tags.slice(0, maxDisplay).join(', ');
  const remaining = tags.length - maxDisplay;

  return `${displayed}, +${remaining} more`;
}

/**
 * Format confidence range for display
 */
export function formatConfidenceRange(min?: number, max?: number): string {
  if (min === undefined && max === undefined) return '';

  if (min !== undefined && max !== undefined) {
    return `${min}-${max}`;
  }

  if (min !== undefined) {
    return `≥${min}`;
  }

  if (max !== undefined) {
    return `≤${max}`;
  }

  return '';
}

// ============================================================================
// URL HANDLING
// ============================================================================

/**
 * Build URL query string from search filters
 * Useful for shareable/bookmarkable URLs
 */
export function buildQueryString(filters: SearchFilters): string {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.project) params.set('project', filters.project);
  if (filters.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));
  if (filters.confidenceMin !== undefined) params.set('confidence_min', filters.confidenceMin.toString());
  if (filters.confidenceMax !== undefined) params.set('confidence_max', filters.confidenceMax.toString());
  if (filters.outcomeStatus && filters.outcomeStatus !== 'all') params.set('outcome_status', filters.outcomeStatus);
  if (filters.flagged !== undefined) params.set('flagged', filters.flagged.toString());
  if (filters.sort && filters.sort !== 'date-desc') params.set('sort', filters.sort);
  if (filters.limit && filters.limit !== 20) params.set('limit', filters.limit.toString());
  if (filters.offset && filters.offset !== 0) params.set('offset', filters.offset.toString());

  return params.toString();
}

/**
 * Parse URL query string into search filters
 * Inverse of buildQueryString
 */
export function parseQueryString(queryString: string): Partial<SearchFilters> {
  const params = new URLSearchParams(queryString);
  const filters: Partial<SearchFilters> = {};

  const search = params.get('search');
  if (search) filters.search = search;

  const category = params.get('category');
  if (category) filters.category = category as any;

  const project = params.get('project');
  if (project) filters.project = project;

  const tags = params.get('tags');
  if (tags) filters.tags = tags.split(',').map((t) => t.trim());

  const confidenceMin = params.get('confidence_min');
  if (confidenceMin) filters.confidenceMin = parseInt(confidenceMin, 10);

  const confidenceMax = params.get('confidence_max');
  if (confidenceMax) filters.confidenceMax = parseInt(confidenceMax, 10);

  const outcomeStatus = params.get('outcome_status');
  if (outcomeStatus) filters.outcomeStatus = outcomeStatus as any;

  const flagged = params.get('flagged');
  if (flagged) filters.flagged = flagged === 'true';

  const sort = params.get('sort');
  if (sort) filters.sort = sort as any;

  const limit = params.get('limit');
  if (limit) filters.limit = parseInt(limit, 10);

  const offset = params.get('offset');
  if (offset) filters.offset = parseInt(offset, 10);

  return filters;
}

// ============================================================================
// RESULT FORMATTING
// ============================================================================

/**
 * Format result count for display
 * Example: "Showing 1-20 of 142 decisions"
 */
export function formatResultCount(
  offset: number,
  limit: number,
  total: number,
  currentCount: number
): string {
  if (total === 0) {
    return 'No decisions found';
  }

  const start = offset + 1;
  const end = Math.min(offset + currentCount, total);

  if (total === 1) {
    return '1 decision';
  }

  return `Showing ${start}-${end} of ${total} decisions`;
}

/**
 * Get page number from offset and limit
 */
export function getPageNumber(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1;
}

/**
 * Get total pages from total count and limit
 */
export function getTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

// ============================================================================
// FILTER CLEARING
// ============================================================================

/**
 * Clear all filters and return default state
 */
export function clearFilters(): SearchFilters {
  return { ...DEFAULT_SEARCH_FILTERS };
}

/**
 * Clear specific filter type
 */
export function clearFilterType(
  filters: SearchFilters,
  filterType: keyof SearchFilters
): SearchFilters {
  const newFilters = { ...filters };

  switch (filterType) {
    case 'search':
      delete newFilters.search;
      break;
    case 'category':
      delete newFilters.category;
      break;
    case 'project':
      delete newFilters.project;
      break;
    case 'tags':
      newFilters.tags = [];
      break;
    case 'confidenceMin':
    case 'confidenceMax':
      delete newFilters.confidenceMin;
      delete newFilters.confidenceMax;
      break;
    case 'outcomeStatus':
      newFilters.outcomeStatus = 'all';
      break;
    case 'flagged':
      delete newFilters.flagged;
      break;
    default:
      break;
  }

  // Reset offset when clearing filters
  newFilters.offset = 0;

  return newFilters;
}

// ============================================================================
// SORT HELPERS
// ============================================================================

/**
 * Get human-readable sort label
 */
export function getSortLabel(sort: SearchFilters['sort']): string {
  const labels = {
    'date-desc': 'Newest first',
    'date-asc': 'Oldest first',
    'confidence-desc': 'Highest confidence',
    'confidence-asc': 'Lowest confidence',
    relevance: 'Most relevant',
  };

  return labels[sort || 'date-desc'] || 'Newest first';
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if search term is valid
 */
export function isValidSearchTerm(term: string | undefined): boolean {
  if (!term) return true; // Empty is valid
  return term.trim().length > 0 && term.length <= 500;
}

/**
 * Check if confidence range is valid
 */
export function isValidConfidenceRange(min?: number, max?: number): boolean {
  if (min !== undefined && (min < 1 || min > 10)) return false;
  if (max !== undefined && (max < 1 || max > 10)) return false;
  if (min !== undefined && max !== undefined && min > max) return false;
  return true;
}
