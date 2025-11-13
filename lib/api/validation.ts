// ============================================================================
// API VALIDATION
// ============================================================================
// Purpose: Input validation logic for all decision CRUD operations
// Usage: Import validation functions in API routes before database operations
// Returns: { valid: boolean, errors: ValidationError[] }
// ============================================================================

import {
  DecisionCategory,
  DecisionType,
  OptimizedFor,
  DecisionOption,
  DECISION_CATEGORIES,
  DECISION_TYPES,
  OPTIMIZED_FOR_OPTIONS,
} from '@/lib/types/decisions';

import type { ValidationError } from '@/lib/api/responses';

// ============================================================================
// VALIDATION RESULT TYPE
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

/**
 * Validate required string field
 */
function validateRequiredString(
  value: any,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    return { field: fieldName, message: 'This field is required' };
  }

  if (typeof value !== 'string') {
    return { field: fieldName, message: 'Must be a string' };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { field: fieldName, message: 'Cannot be empty or only whitespace' };
  }

  if (minLength && trimmed.length < minLength) {
    return {
      field: fieldName,
      message: `Must be at least ${minLength} characters (currently ${trimmed.length})`,
    };
  }

  if (maxLength && trimmed.length > maxLength) {
    return {
      field: fieldName,
      message: `Must be at most ${maxLength} characters (currently ${trimmed.length})`,
    };
  }

  return null;
}

/**
 * Validate optional string field
 */
function validateOptionalString(
  value: any,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): ValidationError | null {
  // Allow null/undefined for optional fields
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return validateRequiredString(value, fieldName, minLength, maxLength);
}

/**
 * Validate integer within range
 */
function validateInteger(
  value: any,
  fieldName: string,
  min: number,
  max: number,
  required: boolean = true
): ValidationError | null {
  if (value === undefined || value === null) {
    if (required) {
      return { field: fieldName, message: 'This field is required' };
    }
    return null;
  }

  const num = Number(value);

  if (!Number.isInteger(num)) {
    return { field: fieldName, message: 'Must be an integer' };
  }

  if (num < min || num > max) {
    return { field: fieldName, message: `Must be between ${min} and ${max}` };
  }

  return null;
}

/**
 * Validate enum value
 */
function validateEnum<T extends string>(
  value: any,
  fieldName: string,
  validValues: readonly T[],
  required: boolean = true
): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    if (required) {
      return { field: fieldName, message: 'This field is required' };
    }
    return null;
  }

  if (!validValues.includes(value as T)) {
    return {
      field: fieldName,
      message: `Invalid value. Must be one of: ${validValues.join(', ')}`,
    };
  }

  return null;
}

/**
 * Validate array field
 */
function validateArray(
  value: any,
  fieldName: string,
  required: boolean = true,
  minLength?: number
): ValidationError | null {
  if (value === undefined || value === null) {
    if (required) {
      return { field: fieldName, message: 'This field is required' };
    }
    return null;
  }

  if (!Array.isArray(value)) {
    return { field: fieldName, message: 'Must be an array' };
  }

  if (minLength && value.length < minLength) {
    return {
      field: fieldName,
      message: `Must have at least ${minLength} item${minLength > 1 ? 's' : ''}`,
    };
  }

  return null;
}

/**
 * Validate array of strings
 */
function validateStringArray(
  value: any,
  fieldName: string,
  required: boolean = true,
  minLength?: number
): ValidationError | null {
  const arrayError = validateArray(value, fieldName, required, minLength);
  if (arrayError) return arrayError;

  // If not required and empty/null, that's ok
  if (!required && (!value || value.length === 0)) {
    return null;
  }

  // Check all items are strings
  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'string') {
      return { field: fieldName, message: `All items must be strings (item ${i} is not)` };
    }
  }

  return null;
}

/**
 * Validate array of enum values
 */
function validateEnumArray<T extends string>(
  value: any,
  fieldName: string,
  validValues: readonly T[],
  required: boolean = true,
  minLength?: number
): ValidationError | null {
  const arrayError = validateArray(value, fieldName, required, minLength);
  if (arrayError) return arrayError;

  // If not required and empty/null, that's ok
  if (!required && (!value || value.length === 0)) {
    return null;
  }

  // Check all items are valid enum values
  for (let i = 0; i < value.length; i++) {
    if (!validValues.includes(value[i] as T)) {
      return {
        field: fieldName,
        message: `Invalid value at index ${i}. Must be one of: ${validValues.join(', ')}`,
      };
    }
  }

  return null;
}

/**
 * Validate ISO-8601 date string
 */
function validateDateString(
  value: any,
  fieldName: string,
  required: boolean = false
): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    if (required) {
      return { field: fieldName, message: 'This field is required' };
    }
    return null;
  }

  if (typeof value !== 'string') {
    return { field: fieldName, message: 'Must be a string (ISO-8601 date format)' };
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { field: fieldName, message: 'Invalid date format (expected ISO-8601)' };
  }

  return null;
}

/**
 * Validate boolean field
 */
function validateBoolean(
  value: any,
  fieldName: string,
  required: boolean = false
): ValidationError | null {
  if (value === undefined || value === null) {
    if (required) {
      return { field: fieldName, message: 'This field is required' };
    }
    return null;
  }

  if (typeof value !== 'boolean') {
    return { field: fieldName, message: 'Must be a boolean (true or false)' };
  }

  return null;
}

/**
 * Validate options_considered array
 */
function validateOptionsConsidered(
  value: any,
  fieldName: string = 'options_considered',
  required: boolean = true
): ValidationError | null {
  const arrayError = validateArray(value, fieldName, required, required ? 1 : 0);
  if (arrayError) return arrayError;

  if (!required && (!value || value.length === 0)) {
    return null;
  }

  // Validate each option object
  for (let i = 0; i < value.length; i++) {
    const option = value[i];

    if (!option || typeof option !== 'object') {
      return { field: fieldName, message: `Option at index ${i} must be an object` };
    }

    if (!option.name || typeof option.name !== 'string') {
      return { field: fieldName, message: `Option at index ${i} must have a 'name' (string)` };
    }

    if (!option.description || typeof option.description !== 'string') {
      return {
        field: fieldName,
        message: `Option at index ${i} must have a 'description' (string)`,
      };
    }

    if (!Array.isArray(option.pros)) {
      return { field: fieldName, message: `Option at index ${i} must have a 'pros' array` };
    }

    if (!Array.isArray(option.cons)) {
      return { field: fieldName, message: `Option at index ${i} must have a 'cons' array` };
    }
  }

  return null;
}

/**
 * Validate UUID format
 */
function validateUUID(value: any, fieldName: string): ValidationError | null {
  if (!value || typeof value !== 'string') {
    return { field: fieldName, message: 'Must be a valid UUID string' };
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    return { field: fieldName, message: 'Invalid UUID format' };
  }

  return null;
}

// ============================================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate data for creating a new decision
 */
export function validateCreateDecision(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields - simplified to essentials only
  const titleError = validateRequiredString(data.title, 'title', 1, 200);
  if (titleError) errors.push(titleError);

  const projectError = validateRequiredString(data.project_name, 'project_name', 1);
  if (projectError) errors.push(projectError);

  const chosenError = validateRequiredString(data.chosen_option, 'chosen_option', 1);
  if (chosenError) errors.push(chosenError);

  const reasoningError = validateRequiredString(data.reasoning, 'reasoning', 10);
  if (reasoningError) errors.push(reasoningError);

  const categoryError = validateEnum(
    data.category,
    'category',
    DECISION_CATEGORIES,
    true
  );
  if (categoryError) errors.push(categoryError);

  // Options considered is required but simplified validation
  const optionsError = validateOptionsConsidered(data.options_considered, 'options_considered', true);
  if (optionsError) errors.push(optionsError);

  // Tradeoffs - at least one of accepted or rejected should be provided
  const hasTradeoffs =
    (Array.isArray(data.tradeoffs_accepted) && data.tradeoffs_accepted.length > 0) ||
    (Array.isArray(data.tradeoffs_rejected) && data.tradeoffs_rejected.length > 0);

  if (!hasTradeoffs) {
    errors.push({
      field: 'tradeoffs',
      message: 'Please provide at least one tradeoff (accepted or rejected)'
    });
  }

  // Validate tradeoff arrays if provided
  const tradeoffsAcceptedError = validateStringArray(
    data.tradeoffs_accepted,
    'tradeoffs_accepted',
    false
  );
  if (tradeoffsAcceptedError) errors.push(tradeoffsAcceptedError);

  const tradeoffsRejectedError = validateStringArray(
    data.tradeoffs_rejected,
    'tradeoffs_rejected',
    false
  );
  if (tradeoffsRejectedError) errors.push(tradeoffsRejectedError);

  // Optional fields that were previously required (no minimum length)
  const contextError = validateOptionalString(data.business_context, 'business_context');
  if (contextError) errors.push(contextError);

  const problemError = validateOptionalString(data.problem_statement, 'problem_statement');
  if (problemError) errors.push(problemError);

  const confidenceError = validateInteger(data.confidence_level, 'confidence_level', 1, 10, false);
  if (confidenceError) errors.push(confidenceError);

  const optimizedError = validateEnumArray(
    data.optimized_for,
    'optimized_for',
    OPTIMIZED_FOR_OPTIONS,
    false
  );
  if (optimizedError) errors.push(optimizedError);

  // Optional fields
  const tagsError = validateStringArray(data.tags, 'tags', false);
  if (tagsError) errors.push(tagsError);

  const stakeholdersError = validateStringArray(data.stakeholders, 'stakeholders', false);
  if (stakeholdersError) errors.push(stakeholdersError);

  const assumptionsError = validateStringArray(data.assumptions, 'assumptions', false);
  if (assumptionsError) errors.push(assumptionsError);

  const invalidationError = validateStringArray(
    data.invalidation_conditions,
    'invalidation_conditions',
    false
  );
  if (invalidationError) errors.push(invalidationError);

  const notesError = validateOptionalString(data.notes, 'notes');
  if (notesError) errors.push(notesError);

  const decisionTypeError = validateEnum(
    data.decision_type,
    'decision_type',
    DECISION_TYPES,
    false
  );
  if (decisionTypeError) errors.push(decisionTypeError);

  const flaggedError = validateBoolean(data.flagged_for_review, 'flagged_for_review', false);
  if (flaggedError) errors.push(flaggedError);

  const reviewDateError = validateDateString(data.next_review_date, 'next_review_date', false);
  if (reviewDateError) errors.push(reviewDateError);

  const revisitError = validateOptionalString(data.revisit_reason, 'revisit_reason');
  if (revisitError) errors.push(revisitError);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate data for updating an existing decision
 * All fields are optional, but if provided, must be valid
 */
export function validateUpdateDecision(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Only validate fields that are present
  if (data.title !== undefined) {
    const error = validateOptionalString(data.title, 'title', 1, 200);
    if (error) errors.push(error);
  }

  if (data.business_context !== undefined) {
    const error = validateOptionalString(data.business_context, 'business_context', 20);
    if (error) errors.push(error);
  }

  if (data.problem_statement !== undefined) {
    const error = validateOptionalString(data.problem_statement, 'problem_statement', 20);
    if (error) errors.push(error);
  }

  if (data.chosen_option !== undefined) {
    const error = validateOptionalString(data.chosen_option, 'chosen_option', 1);
    if (error) errors.push(error);
  }

  if (data.reasoning !== undefined) {
    const error = validateOptionalString(data.reasoning, 'reasoning', 50);
    if (error) errors.push(error);
  }

  if (data.confidence_level !== undefined) {
    const error = validateInteger(data.confidence_level, 'confidence_level', 1, 10, false);
    if (error) errors.push(error);
  }

  if (data.category !== undefined) {
    const error = validateEnum(data.category, 'category', DECISION_CATEGORIES, false);
    if (error) errors.push(error);
  }

  if (data.project_name !== undefined) {
    const error = validateOptionalString(data.project_name, 'project_name', 1);
    if (error) errors.push(error);
  }

  if (data.optimized_for !== undefined) {
    const error = validateEnumArray(
      data.optimized_for,
      'optimized_for',
      OPTIMIZED_FOR_OPTIONS,
      false
    );
    if (error) errors.push(error);
  }

  if (data.tradeoffs_accepted !== undefined) {
    const error = validateStringArray(data.tradeoffs_accepted, 'tradeoffs_accepted', false);
    if (error) errors.push(error);
  }

  if (data.tradeoffs_rejected !== undefined) {
    const error = validateStringArray(data.tradeoffs_rejected, 'tradeoffs_rejected', false);
    if (error) errors.push(error);
  }

  if (data.options_considered !== undefined) {
    const error = validateOptionsConsidered(data.options_considered, 'options_considered', false);
    if (error) errors.push(error);
  }

  if (data.tags !== undefined) {
    const error = validateStringArray(data.tags, 'tags', false);
    if (error) errors.push(error);
  }

  if (data.stakeholders !== undefined) {
    const error = validateStringArray(data.stakeholders, 'stakeholders', false);
    if (error) errors.push(error);
  }

  if (data.assumptions !== undefined) {
    const error = validateStringArray(data.assumptions, 'assumptions', false);
    if (error) errors.push(error);
  }

  if (data.invalidation_conditions !== undefined) {
    const error = validateStringArray(
      data.invalidation_conditions,
      'invalidation_conditions',
      false
    );
    if (error) errors.push(error);
  }

  if (data.notes !== undefined) {
    const error = validateOptionalString(data.notes, 'notes');
    if (error) errors.push(error);
  }

  if (data.decision_type !== undefined) {
    const error = validateEnum(data.decision_type, 'decision_type', DECISION_TYPES, false);
    if (error) errors.push(error);
  }

  if (data.flagged_for_review !== undefined) {
    const error = validateBoolean(data.flagged_for_review, 'flagged_for_review', false);
    if (error) errors.push(error);
  }

  if (data.next_review_date !== undefined) {
    const error = validateDateString(data.next_review_date, 'next_review_date', false);
    if (error) errors.push(error);
  }

  if (data.revisit_reason !== undefined) {
    const error = validateOptionalString(data.revisit_reason, 'revisit_reason');
    if (error) errors.push(error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate outcome update data
 */
export function validateOutcomeUpdate(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  const successError = validateBoolean(data.outcome_success, 'outcome_success', true);
  if (successError) errors.push(successError);

  const outcomeError = validateRequiredString(data.outcome, 'outcome', 20);
  if (outcomeError) errors.push(outcomeError);

  const lessonsError = validateOptionalString(data.lessons_learned, 'lessons_learned', 20);
  if (lessonsError) errors.push(lessonsError);

  const dateError = validateDateString(data.outcome_date, 'outcome_date', false);
  if (dateError) errors.push(dateError);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate similar decision link data
 */
export function validateSimilarLink(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  const idError = validateUUID(data.similar_to_id, 'similar_to_id');
  if (idError) errors.push(idError);

  const reasonError = validateRequiredString(data.reason, 'reason', 10);
  if (reasonError) errors.push(reasonError);

  const comparisonError = validateRequiredString(data.comparison, 'comparison', 20);
  if (comparisonError) errors.push(comparisonError);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate flag for review data
 */
export function validateFlagForReview(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  const flaggedError = validateBoolean(data.flagged, 'flagged', true);
  if (flaggedError) errors.push(flaggedError);

  const dateError = validateDateString(data.next_review_date, 'next_review_date', false);
  if (dateError) errors.push(dateError);

  const reasonError = validateOptionalString(data.revisit_reason, 'revisit_reason', 10);
  if (reasonError) errors.push(reasonError);

  return {
    valid: errors.length === 0,
    errors,
  };
}
