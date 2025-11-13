'use client';

// ============================================================================
// DECISIONS LIST PAGE
// ============================================================================
// Purpose: Main decisions browsing page with advanced filtering and search
// Route: /decisions
// Features: Filter panel, search, sort, pagination, category/project filtering
// ============================================================================

import { useState, useEffect } from 'react';
import { FilterPanel, FilterValues } from '@/components/filters/FilterPanel';
import { DecisionList } from '@/components/decisions/DecisionList';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { apiGet } from '@/lib/api/client';
import { Decision, DecisionCategory, CATEGORY_LABELS } from '@/lib/types/decisions';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export default function DecisionsPage() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    category: undefined,
    project: undefined,
    tags: [],
    confidenceMin: undefined,
    confidenceMax: undefined,
    outcomeStatus: 'all',
    sort: 'date-desc',
  });

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Fetch decisions
  useEffect(() => {
    async function fetchDecisions() {
      try {
        setIsLoading(true);
        setError(null);

        // Build query params
        const params = new URLSearchParams();

        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.project) params.append('project', filters.project);
        if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));
        if (filters.confidenceMin) params.append('confidence_min', filters.confidenceMin.toString());
        if (filters.confidenceMax) params.append('confidence_max', filters.confidenceMax.toString());
        if (filters.outcomeStatus !== 'all') params.append('outcome_status', filters.outcomeStatus);
        if (filters.sort) params.append('sort', filters.sort);
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());

        const data = await apiGet<{ decisions: Decision[]; total: number }>(
          `/api/decisions?${params.toString()}`
        );

        if (offset === 0) {
          setDecisions(data.decisions);
        } else {
          setDecisions((prev) => [...prev, ...data.decisions]);
        }
        setTotal(data.total);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch decisions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDecisions();
  }, [filters, offset]);

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setOffset(0); // Reset pagination when filters change
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: undefined,
      project: undefined,
      tags: [],
      confidenceMin: undefined,
      confidenceMax: undefined,
      outcomeStatus: 'all',
      sort: 'date-desc',
    });
    setOffset(0);
  };

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  const hasMore = decisions.length < total;

  // Active filters for display
  const activeFilters: Array<{ label: string; value: string; onRemove: () => void }> = [];
  if (filters.search) {
    activeFilters.push({
      label: 'Search',
      value: filters.search,
      onRemove: () => handleFiltersChange({ ...filters, search: '' }),
    });
  }
  if (filters.category) {
    activeFilters.push({
      label: 'Category',
      value: CATEGORY_LABELS[filters.category],
      onRemove: () => handleFiltersChange({ ...filters, category: undefined }),
    });
  }
  if (filters.project) {
    activeFilters.push({
      label: 'Project',
      value: filters.project,
      onRemove: () => handleFiltersChange({ ...filters, project: undefined }),
    });
  }
  filters.tags.forEach((tag) => {
    activeFilters.push({
      label: 'Tag',
      value: tag,
      onRemove: () =>
        handleFiltersChange({ ...filters, tags: filters.tags.filter((t) => t !== tag) }),
    });
  });
  if (filters.confidenceMin || filters.confidenceMax) {
    activeFilters.push({
      label: 'Confidence',
      value: `${filters.confidenceMin || 1}-${filters.confidenceMax || 10}`,
      onRemove: () =>
        handleFiltersChange({ ...filters, confidenceMin: undefined, confidenceMax: undefined }),
    });
  }
  if (filters.outcomeStatus !== 'all') {
    activeFilters.push({
      label: 'Outcome',
      value: filters.outcomeStatus,
      onRemove: () => handleFiltersChange({ ...filters, outcomeStatus: 'all' }),
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Decisions
              <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-[#DA70D6] via-[#8B5CF6] to-[#14B8A6] ml-2 animate-pulse"></span>
            </h1>
            <p className="text-gray-600 mt-1">
              {isLoading && offset === 0
                ? 'Loading...'
                : `${total} decision${total !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <Link href="/decisions/new">
            <Button variant="primary" className="flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all">
              <Plus className="h-4 w-4" />
              New Decision
            </Button>
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Active filters chips */}
        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Active filters:</span>
            {activeFilters.map((filter, index) => (
              <Chip key={index} label={`${filter.label}: ${filter.value}`} onRemove={filter.onRemove} />
            ))}
          </div>
        )}

        {/* Main layout */}
        <div className={cn('grid gap-8', isMobile ? 'grid-cols-1' : 'lg:grid-cols-4')}>
          {/* Filters sidebar */}
          {!isMobile && (
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <FilterPanel
                  filters={filters}
                  onChange={handleFiltersChange}
                  onReset={handleResetFilters}
                />
              </div>
            </aside>
          )}

          {/* Main content */}
          <main className={cn(isMobile ? 'col-span-1' : 'lg:col-span-3')}>
            {/* Mobile filters */}
            {isMobile && (
              <div className="mb-6">
                <FilterPanel
                  filters={filters}
                  onChange={handleFiltersChange}
                  onReset={handleResetFilters}
                  isMobile
                />
              </div>
            )}

            {/* Decision list */}
            <DecisionList
              decisions={decisions}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
