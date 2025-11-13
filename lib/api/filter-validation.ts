// ============================================================================
// SEARCH FILTER VALIDATION
// ============================================================================
// Purpose: Validate and sanitize search/filter parameters
// Usage: Call before executing database queries
// Returns: { valid, error?, sanitized? }
// ============================================================================

import {
  SearchFilters,
  FilterValidationResult,
  SortOption,
  SEARCH_LIMITS,
  isValidSortOption,
  isValidOutcomeStatus,
} from '@/lib/types/search';
import {
  DecisionCategory,
  DECISION_CATEGORIES,
  isDecisionCategory,
} from '@/lib/types/decisions';

// ============================================================================
// INDIVIDUAL FIELD VALIDATORS
// ============================================================================

/**
 * Validate search term
 */
export function validateSearchTerm(search: any): FilterValidationResult {
  // Allow empty/undefined
  if (search === undefined || search === null || search === '') {
    return { valid: true, sanitized: undefined };
  }

  if (typeof search !== 'string') {
    return { valid: false, error: 'Search term must be a string' };
  }

  const trimmed = search.trim();

  if (trimmed.length === 0) {
    return { valid: true, sanitized: undefined };
  }

  if (trimmed.length > SEARCH_LIMITS.MAX_SEARCH_LENGTH) {
    return {
      valid: false,
      error: `Search term too long (max ${SEARCH_LIMITS.MAX_SEARCH_LENGTH} characters)`,
    };
  }

  // Sanitize: remove excessive whitespace
  const sanitized = trimmed.replace(/\s+/g, ' ');

  return { valid: true, sanitized };
}

/**
 * Validate category filter
 */
export function validateCategory(category: any): FilterValidationResult {
  // Allow empty/undefined
  if (category === undefined || category === null || category === '') {
    return { valid: true, sanitized: undefined };
  }

  if (typeof category !== 'string') {
    return { valid: false, error: 'Category must be a string' };
  }

  if (!isDecisionCategory(category)) {
    return {
      valid: false,
      error: `Invalid category. Must be one of: ${DECISION_CATEGORIES.join(', ')}`,
    };
  }

  return { valid: true, sanitized: category as DecisionCategory };
}

/**
 * Validate project filter
 */
export function validateProject(project: any): FilterValidationResult {
  // Allow empty/undefined
  if (project === undefined || project === null || project === '') {
    return { valid: true, sanitized: undefined };
  }

  if (typeof project !== 'string') {
    return { valid: false, error: 'Project must be a string' };
  }

  const trimmed = project.trim();

  if (trimmed.length === 0) {
    return { valid: true, sanitized: undefined };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate tags filter
 */
export function validateTags(tags: any): FilterValidationResult {
  // Allow empty/undefined
  if (tags === undefined || tags === null) {
    return { valid: true, sanitized: undefined };
  }

  if (!Array.isArray(tags)) {
    return { valid: false, error: 'Tags must be an array' };
  }

  if (tags.length === 0) {
    return { valid: true, sanitized: undefined };
  }

  if (tags.length > SEARCH_LIMITS.MAX_TAG_COUNT) {
    return {
      valid: false,
      error: `Too many tags (max ${SEARCH_LIMITS.MAX_TAG_COUNT})`,
    };
  }

  // Validate each tag is a string
  for (const tag of tags) {
    if (typeof tag !== 'string') {
      return { valid: false, error: 'All tags must be strings' };
    }
  }

  // Sanitize: trim, remove duplicates, filter empty
  const sanitized = [...new Set(tags.map((t) => t.trim()).filter((t) => t.length > 0))];

  if (sanitized.length === 0) {
    return { valid: true, sanitized: undefined };
  }

  return { valid: true, sanitized };
}

/**
 * Validate confidence range
 */
export function validateConfidenceRange(
  min: any,
  max: any
): FilterValidationResult {
  const minResult = validateConfidenceValue(min, 'confidenceMin');
  if (!minResult.valid) return minResult;

  const maxResult = validateConfidenceValue(max, 'confidenceMax');
  if (!maxResult.valid) return maxResult;

  const minValue = minResult.sanitized;
  const maxValue = maxResult.sanitized;

  // If both provided, ensure min <= max
  if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
    return {
      valid: false,
      error: 'confidenceMin cannot be greater than confidenceMax',
    };
  }

  return {
    valid: true,
    sanitized: {
      min: minValue,
      max: maxValue,
    },
  };
}

/**
 * Validate single confidence value
 */
function validateConfidenceValue(
  value: any,
  fieldName: string
): FilterValidationResult {
  // Allow empty/undefined
  if (value === undefined || value === null || value === '') {
    return { valid: true, sanitized: undefined };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }

  if (!Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }

  if (num < 1 || num > 10) {
    return { valid: false, error: `${fieldName} must be between 1 and 10` };
  }

  return { valid: true, sanitized: num };
}

/**
 * Validate outcome status filter
 */
export function validateOutcomeStatus(status: any): FilterValidationResult {
  // Allow empty/undefined
  if (status === undefined || status === null || status === '') {
    return { valid: true, sanitized: 'all' };
  }

  if (typeof status !== 'string') {
    return { valid: false, error: 'Outcome status must be a string' };
  }

  if (!isValidOutcomeStatus(status)) {
    return {
      valid: false,
      error: 'Outcome status must be one of: all, pending, success, failed',
    };
  }

  return { valid: true, sanitized: status };
}

/**
 * Validate flagged filter
 */
export function validateFlagged(flagged: any): FilterValidationResult {
  // Allow empty/undefined
  if (flagged === undefined || flagged === null || flagged === '') {
    return { valid: true, sanitized: undefined };
  }

  // Handle string boolean values
  if (typeof flagged === 'string') {
    if (flagged === 'true') return { valid: true, sanitized: true };
    if (flagged === 'false') return { valid: true, sanitized: false };
    return { valid: false, error: 'Flagged must be a boolean (true or false)' };
  }

  if (typeof flagged !== 'boolean') {
    return { valid: false, error: 'Flagged must be a boolean' };
  }

  return { valid: true, sanitized: flagged };
}

/**
 * Validate sort option
 */
export function validateSort(sort: any, hasSearch: boolean): FilterValidationResult {
  // Default to date-desc
  if (sort === undefined || sort === null || sort === '') {
    // If search term provided, default to relevance
    return { valid: true, sanitized: hasSearch ? 'relevance' : 'date-desc' };
  }

  if (typeof sort !== 'string') {
    return { valid: false, error: 'Sort must be a string' };
  }

  if (!isValidSortOption(sort)) {
    return {
      valid: false,
      error: 'Sort must be one of: date-desc, date-asc, confidence-desc, confidence-asc, relevance',
    };
  }

  // If relevance sorting but no search term, fall back to date-desc
  if (sort === 'relevance' && !hasSearch) {
    return {
      valid: true,
      sanitized: 'date-desc',
    };
  }

  return { valid: true, sanitized: sort as SortOption };
}

/**
 * Validate limit parameter
 */
export function validateLimit(limit: any): FilterValidationResult {
  // Default to 20
  if (limit === undefined || limit === null || limit === '') {
    return { valid: true, sanitized: 20 };
  }

  const num = Number(limit);

  if (isNaN(num)) {
    return { valid: false, error: 'Limit must be a number' };
  }

  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Limit must be an integer' };
  }

  if (num < 1) {
    return { valid: false, error: 'Limit must be at least 1' };
  }

  // Cap at MAX_LIMIT
  const sanitized = Math.min(num, SEARCH_LIMITS.MAX_LIMIT);

  return { valid: true, sanitized };
}

/**
 * Validate offset parameter
 */
export function validateOffset(offset: any): FilterValidationResult {
  // Default to 0
  if (offset === undefined || offset === null || offset === '') {
    return { valid: true, sanitized: 0 };
  }

  const num = Number(offset);

  if (isNaN(num)) {
    return { valid: false, error: 'Offset must be a number' };
  }

  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Offset must be an integer' };
  }

  if (num < 0) {
    return { valid: true, sanitized: 0 }; // Auto-correct negative to 0
  }

  return { valid: true, sanitized: num };
}

// ============================================================================
// COMBINED VALIDATOR
// ============================================================================

/**
 * Validate all search filters at once
 * Returns sanitized filters or validation errors
 */
export function validateSearchFilters(
  filters: Partial<SearchFilters>
): { valid: true; sanitized: SearchFilters } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  const sanitized: Partial<SearchFilters> = {};

  // Validate search term
  const searchResult = validateSearchTerm(filters.search);
  if (!searchResult.valid) {
    errors.push(searchResult.error!);
  } else {
    sanitized.search = searchResult.sanitized;
  }

  // Validate category
  const categoryResult = validateCategory(filters.category);
  if (!categoryResult.valid) {
    errors.push(categoryResult.error!);
  } else {
    sanitized.category = categoryResult.sanitized;
  }

  // Validate project
  const projectResult = validateProject(filters.project);
  if (!projectResult.valid) {
    errors.push(projectResult.error!);
  } else {
    sanitized.project = projectResult.sanitized;
  }

  // Validate tags
  const tagsResult = validateTags(filters.tags);
  if (!tagsResult.valid) {
    errors.push(tagsResult.error!);
  } else {
    sanitized.tags = tagsResult.sanitized;
  }

  // Validate confidence range
  const confidenceResult = validateConfidenceRange(
    filters.confidenceMin,
    filters.confidenceMax
  );
  if (!confidenceResult.valid) {
    errors.push(confidenceResult.error!);
  } else {
    if (confidenceResult.sanitized) {
      sanitized.confidenceMin = confidenceResult.sanitized.min;
      sanitized.confidenceMax = confidenceResult.sanitized.max;
    }
  }

  // Validate outcome status
  const outcomeResult = validateOutcomeStatus(filters.outcomeStatus);
  if (!outcomeResult.valid) {
    errors.push(outcomeResult.error!);
  } else {
    sanitized.outcomeStatus = outcomeResult.sanitized;
  }

  // Validate flagged
  const flaggedResult = validateFlagged(filters.flagged);
  if (!flaggedResult.valid) {
    errors.push(flaggedResult.error!);
  } else {
    sanitized.flagged = flaggedResult.sanitized;
  }

  // Validate sort (depends on whether search term exists)
  const hasSearch = !!sanitized.search;
  const sortResult = validateSort(filters.sort, hasSearch);
  if (!sortResult.valid) {
    errors.push(sortResult.error!);
  } else {
    sanitized.sort = sortResult.sanitized;
  }

  // Validate limit
  const limitResult = validateLimit(filters.limit);
  if (!limitResult.valid) {
    errors.push(limitResult.error!);
  } else {
    sanitized.limit = limitResult.sanitized;
  }

  // Validate offset
  const offsetResult = validateOffset(filters.offset);
  if (!offsetResult.valid) {
    errors.push(offsetResult.error!);
  } else {
    sanitized.offset = offsetResult.sanitized;
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, sanitized: sanitized as SearchFilters };
}
