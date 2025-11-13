// ============================================================================
// REACT HOOK: useDecisions
// ============================================================================
// Purpose: Client-side hook for making API calls to decision endpoints
// Usage: Import in React components for easy API access with loading states
// Features: Loading states, error handling, TypeScript types
// ============================================================================

'use client';

import { useState } from 'react';
import {
  Decision,
  NewDecision,
  UpdateDecision,
  DecisionFilters,
} from '@/lib/types/decisions';
import type { ListDecisionsParams, AnalyticsSummary } from '@/lib/api/decisions-service';

// ============================================================================
// TYPES
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

interface ListDecisionsResponse {
  decisions: Decision[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDecisions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle API errors consistently
   */
  const handleError = (err: any) => {
    const errorMessage = err?.error?.message || err?.message || 'An unexpected error occurred';
    setError(errorMessage);
    throw new Error(errorMessage);
  };

  /**
   * Create a new decision
   */
  const createDecision = async (
    data: Omit<NewDecision, 'date_created' | 'date_updated' | 'search_vector'>
  ): Promise<Decision> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/decisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<Decision> = await response.json();

      if (!response.ok || !result.success) {
        throw result;
      }

      return result.data!;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get a single decision by ID
   */
  const getDecision = async (id: string): Promise<Decision> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/decisions/${id}`);
      const result: ApiResponse<Decision> = await response.json();

      if (!response.ok || !result.success) {
        throw result;
      }

      return result.data!;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * List decisions with filtering and pagination
   */
  const listDecisions = async (
    params?: Partial<ListDecisionsParams>
  ): Promise<ListDecisionsResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query string
      const queryParams = new URLSearchParams();

      if (params?.search) queryParams.set('search', params.search);
      if (params?.category) queryParams.set('category', params.category);
      if (params?.project) queryParams.set('project', params.project);
      if (params?.tags && params.tags.length > 0) queryParams.set('tags', params.tags.join(','));
      if (params?.confidence_min !== undefined)
        queryParams.set('confidence_min', params.confidence_min.toString());
      if (params?.confidence_max !== undefined)
        queryParams.set('confidence_max', params.confidence_max.toString());
      if (params?.outcome_status) queryParams.set('outcome_status', params.outcome_status);
      if (params?.flagged !== undefined) queryParams.set('flagged', params.flagged.toString());
      if (params?.sort) queryParams.set('sort', params.sort);
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.offset) queryParams.set('offset', params.offset.toString());

      const response = await fetch(`/api/decisions?${queryParams.toString()}`);
      const result: ApiResponse<ListDecisionsResponse> = await response.json();

      if (!response.ok || !result.success) {
        throw result;
      }

      return result.data!;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing decision
   */
  const updateDecision = async (
    id: string,
    data: Partial<Omit<Decision, 'id' | 'date_created' | 'date_updated' | 'search_vector'>>
  ): Promise<Decision> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/decisions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<Decision> = await response.json();

      if (!response.ok || !result.success) {
        throw result;
      }

      return result.data!;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a decision
   */
  const deleteDecision = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/decisions/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<{ deleted_id: string }> = await response.json();

      if (!response.ok || !result.success) {
        throw result;
      }
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set decision outcome
   */
  const setOutcome = async (
    id: string,
    outcomeData: {
      outcome_success: boolean;
      outcome: string;
      lessons_learned?: string;
      outcome_date?: string;
    }
  ): Promise<Decision> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/decisions/${id}/outcome`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(outcomeData),
      });

      const result: ApiResponse<Decision> = await response.json();

      if (!response.ok || !result.success) {
        throw result;
      }

      return result.data!;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Flag decision for review
   */
  const flagForReview = async (
    id: string,
    flagData: {
      flagged: boolean;
      next_review_date?: string;
      revisit_reason?: string;
    }
  ): Promise<Decision> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/decisions/${id}/flag-for-review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flagData),
      });

      const result: ApiResponse<Decision> = await response.json();

      if (!response.ok || !result.success) {
        throw result;
      }

      return result.data!;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mark decision as similar to another
   */
  const markSimilar = async (
    id: string,
    similarData: {
      similar_to_id: string;
      reason: string;
      comparison: string;
    }
  ): Promise<Decision> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/decisions/${id}/similar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(similarData),
      });

      const result: ApiResponse<Decision> = await response.json();

      if (!response.ok || !result.success) {
        throw result;
      }

      return result.data!;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get analytics summary
   */
  const getAnalyticsSummary = async (
    period: 'week' | 'month' | 'quarter' | 'all' = 'month',
    category?: string
  ): Promise<AnalyticsSummary> => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('period', period);
      if (category) queryParams.set('category', category);

      const response = await fetch(`/api/decisions/analytics/summary?${queryParams.toString()}`);
      const result: ApiResponse<AnalyticsSummary> = await response.json();

      if (!response.ok || !result.success) {
        throw result;
      }

      return result.data!;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    isLoading,
    error,

    // Functions
    createDecision,
    getDecision,
    listDecisions,
    updateDecision,
    deleteDecision,
    setOutcome,
    flagForReview,
    markSimilar,
    getAnalyticsSummary,
  };
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import { useDecisions } from '@/lib/hooks/useDecisions';

function MyComponent() {
  const { createDecision, listDecisions, isLoading, error } = useDecisions();

  const handleCreate = async () => {
    try {
      const newDecision = await createDecision({
        title: 'My Decision',
        business_context: 'Context here...',
        // ... other fields
      });
      console.log('Created:', newDecision);
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  const handleList = async () => {
    try {
      const result = await listDecisions({
        search: 'supabase',
        category: 'data-storage',
        limit: 20,
      });
      console.log('Decisions:', result.decisions);
    } catch (err) {
      console.error('Failed to list:', err);
    }
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={handleCreate}>Create</button>
      <button onClick={handleList}>List</button>
    </div>
  );
}
*/
