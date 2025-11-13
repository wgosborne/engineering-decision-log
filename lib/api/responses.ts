// ============================================================================
// API RESPONSE UTILITIES
// ============================================================================
// Purpose: Standardized response format for all API endpoints
// Usage: Import these functions in API routes for consistent responses
// Benefits: Consistent error handling, proper HTTP status codes, type safety
// ============================================================================

import { NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Standard API success response format
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation error response format
 */
export interface ApiValidationErrorResponse {
  success: false;
  error: {
    message: string;
    code: 'VALIDATION_ERROR';
    details: ValidationError[];
  };
  timestamp: string;
}

// ============================================================================
// SUCCESS RESPONSES
// ============================================================================

/**
 * Return a successful API response
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @returns NextResponse with success format
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Return a successful creation response
 * @param data - Created resource data
 * @returns NextResponse with 201 status
 */
export function createdResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, 201);
}

/**
 * Return a successful deletion response
 * @param id - ID of deleted resource
 * @returns NextResponse with success message
 */
export function deletedResponse(id: string): NextResponse<ApiSuccessResponse<{ deleted_id: string }>> {
  return successResponse({ deleted_id: id }, 200);
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * Return a generic error response
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 400)
 * @param details - Optional additional error details
 * @param code - Optional error code
 * @returns NextResponse with error format
 */
export function errorResponse(
  message: string,
  statusCode: number = 400,
  details?: any,
  code?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Return a validation error response (400)
 * @param errors - Array of field-level validation errors
 * @returns NextResponse with validation error format
 */
export function validationErrorResponse(
  errors: ValidationError[]
): NextResponse<ApiValidationErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

/**
 * Return a "not found" error response (404)
 * @param resource - Resource type that wasn't found
 * @param id - Optional ID of the resource
 * @returns NextResponse with 404 status
 */
export function notFoundResponse(
  resource: string = 'Resource',
  id?: string
): NextResponse<ApiErrorResponse> {
  const message = id ? `${resource} with id "${id}" not found` : `${resource} not found`;
  return errorResponse(message, 404, undefined, 'NOT_FOUND');
}

/**
 * Return an "unauthorized" error response (401)
 * @param message - Optional custom message
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized access'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401, undefined, 'UNAUTHORIZED');
}

/**
 * Return a "forbidden" error response (403)
 * @param message - Optional custom message
 * @returns NextResponse with 403 status
 */
export function forbiddenResponse(
  message: string = 'Access forbidden'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403, undefined, 'FORBIDDEN');
}

/**
 * Return a "bad request" error response (400)
 * @param message - Error message
 * @param details - Optional error details
 * @returns NextResponse with 400 status
 */
export function badRequestResponse(
  message: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 400, details, 'BAD_REQUEST');
}

/**
 * Return a "server error" response (500)
 * @param message - Error message (don't expose internal details in production)
 * @param error - Original error object (for logging)
 * @returns NextResponse with 500 status
 */
export function serverErrorResponse(
  message: string = 'Internal server error',
  error?: Error
): NextResponse<ApiErrorResponse> {
  // Log error server-side
  if (error) {
    console.error('Server error:', error);
  }

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const details = isDevelopment && error ? { stack: error.stack } : undefined;

  return errorResponse(message, 500, details, 'SERVER_ERROR');
}

/**
 * Return a "method not allowed" error response (405)
 * @param allowedMethods - Array of allowed HTTP methods
 * @returns NextResponse with 405 status
 */
export function methodNotAllowedResponse(
  allowedMethods: string[]
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
        details: { allowedMethods },
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 405,
      headers: {
        Allow: allowedMethods.join(', '),
      },
    }
  );
}

// ============================================================================
// ERROR HANDLING HELPER
// ============================================================================

/**
 * Handle errors in API routes with consistent formatting
 * @param error - Error object
 * @returns Appropriate error response
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Handle different error types
  if (error instanceof Error) {
    // Known error types
    if (error.message.includes('not found')) {
      return notFoundResponse('Decision');
    }

    if (error.message.includes('validation')) {
      return badRequestResponse(error.message);
    }

    if (error.message.includes('Duplicate')) {
      return badRequestResponse('Resource already exists', { originalError: error.message });
    }

    // Default to server error
    return serverErrorResponse(error.message, error);
  }

  // Unknown error type
  return serverErrorResponse('An unexpected error occurred');
}

// ============================================================================
// PAGINATION RESPONSE HELPER
// ============================================================================

/**
 * Format paginated list response
 * @param data - Array of items
 * @param total - Total count of items
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @returns Formatted pagination response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 20
) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return successResponse({
    items: data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  success: successResponse,
  created: createdResponse,
  deleted: deletedResponse,
  error: errorResponse,
  validationError: validationErrorResponse,
  notFound: notFoundResponse,
  unauthorized: unauthorizedResponse,
  forbidden: forbiddenResponse,
  badRequest: badRequestResponse,
  serverError: serverErrorResponse,
  methodNotAllowed: methodNotAllowedResponse,
  handleError: handleApiError,
  paginated: paginatedResponse,
};
