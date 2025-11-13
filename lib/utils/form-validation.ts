// ============================================================================
// FORM VALIDATION UTILITIES
// ============================================================================
// Purpose: Validate form fields for decision creation/editing
// Returns: { valid: boolean, error?: string }
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate decision title
 */
export function validateTitle(title: string | undefined): ValidationResult {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }

  if (title.length < 3) {
    return { valid: false, error: 'Title must be at least 3 characters' };
  }

  if (title.length > 200) {
    return { valid: false, error: 'Title must be less than 200 characters' };
  }

  return { valid: true };
}

/**
 * Validate business context (optional)
 */
export function validateBusinessContext(context: string | undefined): ValidationResult {
  // Optional field
  if (!context || context.trim().length === 0) {
    return { valid: true };
  }

  if (context.length < 3) {
    return { valid: false, error: 'Business context must be at least 3 characters' };
  }

  return { valid: true };
}

/**
 * Validate problem statement (optional)
 */
export function validateProblemStatement(problem: string | undefined): ValidationResult {
  // Optional field
  if (!problem || problem.trim().length === 0) {
    return { valid: true };
  }

  if (problem.length < 3) {
    return { valid: false, error: 'Problem statement must be at least 3 characters' };
  }

  return { valid: true };
}

/**
 * Validate chosen option
 */
export function validateChosenOption(option: string | undefined): ValidationResult {
  if (!option || option.trim().length === 0) {
    return { valid: false, error: 'Chosen option is required' };
  }

  return { valid: true };
}

/**
 * Validate reasoning
 */
export function validateReasoning(reasoning: string | undefined): ValidationResult {
  if (!reasoning || reasoning.trim().length === 0) {
    return { valid: false, error: 'Reasoning is required' };
  }

  if (reasoning.length < 10) {
    return { valid: false, error: 'Reasoning must be at least 10 characters' };
  }

  return { valid: true };
}

/**
 * Validate confidence level (optional)
 */
export function validateConfidence(confidence: number | null | undefined): ValidationResult {
  // Optional field
  if (confidence === null || confidence === undefined) {
    return { valid: true };
  }

  if (confidence < 1 || confidence > 10) {
    return { valid: false, error: 'Confidence must be between 1 and 10' };
  }

  if (!Number.isInteger(confidence)) {
    return { valid: false, error: 'Confidence must be a whole number' };
  }

  return { valid: true };
}

/**
 * Validate category
 */
export function validateCategory(category: string | undefined): ValidationResult {
  if (!category || category.trim().length === 0) {
    return { valid: false, error: 'Category is required' };
  }

  return { valid: true };
}

/**
 * Validate project name (required field)
 */
export function validateProjectName(project: string | undefined): ValidationResult {
  if (!project || project.trim().length === 0) {
    return { valid: false, error: 'Project name is required' };
  }

  if (project.length > 100) {
    return { valid: false, error: 'Project name must be less than 100 characters' };
  }

  return { valid: true };
}

/**
 * Validate tags array
 */
export function validateTags(tags: string[] | undefined): ValidationResult {
  // Optional field
  if (!tags || tags.length === 0) {
    return { valid: true };
  }

  if (tags.length > 20) {
    return { valid: false, error: 'Maximum 20 tags allowed' };
  }

  // Check each tag
  for (const tag of tags) {
    if (tag.length > 50) {
      return { valid: false, error: 'Each tag must be less than 50 characters' };
    }
  }

  return { valid: true };
}

/**
 * Validate email address (for stakeholders)
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email address' };
  }

  return { valid: true };
}

/**
 * Validate date (for outcome date, review date)
 */
export function validateDate(date: string | undefined): ValidationResult {
  if (!date) {
    return { valid: false, error: 'Date is required' };
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  return { valid: true };
}

/**
 * Validate outcome description
 */
export function validateOutcome(outcome: string | undefined): ValidationResult {
  if (!outcome || outcome.trim().length === 0) {
    return { valid: false, error: 'Outcome description is required' };
  }

  if (outcome.length < 10) {
    return { valid: false, error: 'Outcome must be at least 10 characters' };
  }

  return { valid: true };
}

/**
 * Validate entire decision form
 * Returns object with field-specific errors
 */
export function validateDecisionForm(data: any): Record<string, string> {
  const errors: Record<string, string> = {};

  // Required fields
  const titleValidation = validateTitle(data.title);
  if (!titleValidation.valid) {
    errors.title = titleValidation.error!;
  }

  const projectValidation = validateProjectName(data.project_name);
  if (!projectValidation.valid) {
    errors.project_name = projectValidation.error!;
  }

  const chosenValidation = validateChosenOption(data.chosen_option);
  if (!chosenValidation.valid) {
    errors.chosen_option = chosenValidation.error!;
  }

  const reasoningValidation = validateReasoning(data.reasoning);
  if (!reasoningValidation.valid) {
    errors.reasoning = reasoningValidation.error!;
  }

  const categoryValidation = validateCategory(data.category);
  if (!categoryValidation.valid) {
    errors.category = categoryValidation.error!;
  }

  // Optional fields (only validate if provided)
  if (data.business_context) {
    const contextValidation = validateBusinessContext(data.business_context);
    if (!contextValidation.valid) {
      errors.business_context = contextValidation.error!;
    }
  }

  if (data.problem_statement) {
    const problemValidation = validateProblemStatement(data.problem_statement);
    if (!problemValidation.valid) {
      errors.problem_statement = problemValidation.error!;
    }
  }

  if (data.confidence_level !== null && data.confidence_level !== undefined) {
    const confidenceValidation = validateConfidence(data.confidence_level);
    if (!confidenceValidation.valid) {
      errors.confidence_level = confidenceValidation.error!;
    }
  }

  return errors;
}

/**
 * Check if form has any errors
 */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}
