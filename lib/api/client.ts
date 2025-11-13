// ============================================================================
// API CLIENT
// ============================================================================
// Purpose: Frontend API client for making requests to backend
// Features: Type-safe, error handling, loading states
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Make an API request
 * @param endpoint - API endpoint (e.g., '/api/decisions')
 * @param options - Fetch options
 * @returns Typed response data
 */
export async function api<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Parse JSON response
    const data: ApiResponse<T> = await response.json();

    // Handle error responses
    if (!response.ok || !data.success) {
      const errorMessage = data.error?.message || 'An error occurred';
      const errorCode = data.error?.code;
      throw new ApiError(errorMessage, response.status, errorCode);
    }

    // Return data
    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new ApiError('Network error. Please check your connection.', 0);
    }

    // Handle other errors
    throw new ApiError('An unexpected error occurred', 500);
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  return api<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data: any
): Promise<T> {
  return api<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data: any
): Promise<T> {
  return api<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data: any
): Promise<T> {
  return api<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  return api<T>(endpoint, { method: 'DELETE' });
}
