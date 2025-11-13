// ============================================================================
// ADVANCED SEARCH HOOK
// ============================================================================
// Purpose: Comprehensive search and filter management for decisions
// Usage: Import in search/list components for full search functionality
// Features: Filter state, metadata, pagination, loading states
// ============================================================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  SearchFilters,
  SearchResponse,
  SearchMetadata,
  SearchState,
  SearchActions,
  DEFAULT_SEARCH_FILTERS,
  SortOption,
} from '@/lib/types/search';
import { Decision, DecisionCategory } from '@/lib/types/decisions';

// ============================================================================
// HOOK
// ============================================================================

export function useSearch(initialFilters?: Partial<SearchFilters>) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [filters, setFiltersState] = useState<SearchFilters>({
    ...DEFAULT_SEARCH_FILTERS,
    ...initialFilters,
  });

  const [results, setResults] = useState<Decision[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [metadata, setMetadata] = useState<SearchMetadata>({
    availableCategories: [],
    availableProjects: [],
    availableTags: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // ============================================================================
  // EXECUTE SEARCH
  // ============================================================================

  const executeSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query string
      const queryParams = new URLSearchParams();

      if (filters.search) queryParams.set('search', filters.search);
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.project) queryParams.set('project', filters.project);
      if (filters.tags && filters.tags.length > 0) {
        queryParams.set('tags', filters.tags.join(','));
      }
      if (filters.confidenceMin !== undefined) {
        queryParams.set('confidence_min', filters.confidenceMin.toString());
      }
      if (filters.confidenceMax !== undefined) {
        queryParams.set('confidence_max', filters.confidenceMax.toString());
      }
      if (filters.outcomeStatus && filters.outcomeStatus !== 'all') {
        queryParams.set('outcome_status', filters.outcomeStatus);
      }
      if (filters.flagged !== undefined) {
        queryParams.set('flagged', filters.flagged.toString());
      }
      if (filters.sort) queryParams.set('sort', filters.sort);
      if (filters.limit) queryParams.set('limit', filters.limit.toString());
      if (filters.offset) queryParams.set('offset', filters.offset.toString());

      const response = await fetch(`/api/decisions?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to search decisions');
      }

      setResults(data.data.decisions);
      setTotal(data.data.total);
      setHasMore(data.data.hasMore);
      setMetadata(data.data.metadata);
      setHasSearched(true);
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while searching';
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // ============================================================================
  // FILTER ACTIONS
  // ============================================================================

  const setSearchTerm = useCallback((term: string) => {
    setFiltersState((prev) => ({ ...prev, search: term, offset: 0 }));
  }, []);

  const setCategory = useCallback((category: DecisionCategory | undefined) => {
    setFiltersState((prev) => ({ ...prev, category, offset: 0 }));
  }, []);

  const setProject = useCallback((project: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, project, offset: 0 }));
  }, []);

  const setTags = useCallback((tags: string[]) => {
    setFiltersState((prev) => ({ ...prev, tags, offset: 0 }));
  }, []);

  const setConfidenceRange = useCallback((min?: number, max?: number) => {
    setFiltersState((prev) => ({
      ...prev,
      confidenceMin: min,
      confidenceMax: max,
      offset: 0,
    }));
  }, []);

  const setOutcomeStatus = useCallback((status: SearchFilters['outcomeStatus']) => {
    setFiltersState((prev) => ({ ...prev, outcomeStatus: status, offset: 0 }));
  }, []);

  const setFlagged = useCallback((flagged: boolean | undefined) => {
    setFiltersState((prev) => ({ ...prev, flagged, offset: 0 }));
  }, []);

  const setSort = useCallback((sort: SortOption) => {
    setFiltersState((prev) => ({ ...prev, sort }));
  }, []);

  // ============================================================================
  // PAGINATION ACTIONS
  // ============================================================================

  const setLimit = useCallback((limit: number) => {
    setFiltersState((prev) => ({ ...prev, limit }));
  }, []);

  const setOffset = useCallback((offset: number) => {
    setFiltersState((prev) => ({ ...prev, offset }));
  }, []);

  const nextPage = useCallback(() => {
    setFiltersState((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 20),
    }));
  }, []);

  const prevPage = useCallback(() => {
    setFiltersState((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - (prev.limit || 20)),
    }));
  }, []);

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({ ...DEFAULT_SEARCH_FILTERS, ...initialFilters });
    setResults([]);
    setTotal(0);
    setHasMore(false);
    setHasSearched(false);
  }, [initialFilters]);

  const refresh = useCallback(async () => {
    await executeSearch();
  }, [executeSearch]);

  // ============================================================================
  // AUTO-SEARCH ON FILTER CHANGE (OPTIONAL)
  // ============================================================================
  // Note: Auto-search is intentionally disabled to prevent excessive API calls.
  // Users must manually trigger search using the executeSearch function.

  // ============================================================================
  // RETURN STATE & ACTIONS
  // ============================================================================

  const state: SearchState = {
    filters,
    results,
    total,
    hasMore,
    metadata,
    isLoading,
    error,
    hasSearched,
  };

  const actions: SearchActions = {
    setSearchTerm,
    setCategory,
    setProject,
    setTags,
    setConfidenceRange,
    setOutcomeStatus,
    setFlagged,
    setSort,
    setLimit,
    setOffset,
    nextPage,
    prevPage,
    setFilters,
    resetFilters,
    executeSearch,
    refresh,
  };

  return {
    // Spread state
    ...state,
    // Spread actions
    ...actions,
  };
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import { useSearch } from '@/lib/hooks/useSearch';

function SearchPage() {
  const {
    // State
    filters,
    results,
    total,
    hasMore,
    metadata,
    isLoading,
    error,
    hasSearched,

    // Actions
    setSearchTerm,
    setCategory,
    setTags,
    executeSearch,
    resetFilters,
    nextPage,
  } = useSearch();

  const handleSearch = () => {
    executeSearch();
  };

  return (
    <div>
      <input
        value={filters.search || ''}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search decisions..."
      />

      <select onChange={(e) => setCategory(e.target.value as any)}>
        <option value="">All Categories</option>
        {metadata.availableCategories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <button onClick={handleSearch}>Search</button>
      <button onClick={resetFilters}>Reset</button>

      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      <div>
        {results.map((decision) => (
          <div key={decision.id}>{decision.title}</div>
        ))}
      </div>

      {hasMore && <button onClick={nextPage}>Load More</button>}

      <p>Showing {results.length} of {total} decisions</p>
    </div>
  );
}
*/
