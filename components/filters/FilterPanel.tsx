'use client';

// ============================================================================
// FILTER PANEL COMPONENT
// ============================================================================
// Purpose: Main container for all decision filtering controls
// Used in: Decisions list page (/decisions)
// Features: Search, category, project, tags, confidence, outcome, sort filters
// ============================================================================

import { cn } from '@/lib/utils/cn';
import { SearchInput } from './SearchInput';
import { CategoryFilter } from './CategoryFilter';
import { ProjectFilter } from './ProjectFilter';
import { TagFilter } from './TagFilter';
import { ConfidenceFilter } from './ConfidenceFilter';
import { OutcomeFilter } from './OutcomeFilter';
import { SortDropdown } from './SortDropdown';
import { Button } from '@/components/ui/Button';
import { X, SlidersHorizontal } from 'lucide-react';
import { DecisionCategory } from '@/lib/types/decisions';
import { SortOption } from '@/lib/types/search';
import { useState } from 'react';

export interface FilterValues {
  search: string;
  category?: DecisionCategory;
  project?: string;
  tags: string[];
  confidenceMin?: number;
  confidenceMax?: number;
  outcomeStatus: 'all' | 'pending' | 'success' | 'failed';
  sort: SortOption;
}

interface FilterPanelProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onReset: () => void;
  className?: string;
  isMobile?: boolean;
}

export function FilterPanel({
  filters,
  onChange,
  onReset,
  className,
  isMobile = false,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(!isMobile);

  const updateFilter = <K extends keyof FilterValues>(
    key: K,
    value: FilterValues[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.project ||
    filters.tags.length > 0 ||
    filters.confidenceMin ||
    filters.confidenceMax ||
    filters.outcomeStatus !== 'all';

  const filterCount = [
    filters.search,
    filters.category,
    filters.project,
    filters.tags.length > 0,
    filters.confidenceMin,
    filters.confidenceMax,
    filters.outcomeStatus !== 'all',
  ].filter(Boolean).length;

  if (isMobile) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Mobile toggle button */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {filterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-[#F5B5C5] rounded-full">
                {filterCount}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={onReset} className="text-sm">
              Clear All
            </Button>
          )}
        </div>

        {/* Mobile filter panel (collapsible) */}
        {isOpen && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
            <SearchInput
              value={filters.search}
              onChange={(value) => updateFilter('search', value)}
            />
            <CategoryFilter
              value={filters.category}
              onChange={(value) => updateFilter('category', value)}
            />
            <ProjectFilter
              value={filters.project}
              onChange={(value) => updateFilter('project', value)}
            />
            <TagFilter
              value={filters.tags}
              onChange={(value) => updateFilter('tags', value)}
            />
            <ConfidenceFilter
              min={filters.confidenceMin}
              max={filters.confidenceMax}
              onChange={(min, max) => {
                onChange({ ...filters, confidenceMin: min, confidenceMax: max });
              }}
            />
            <OutcomeFilter
              value={filters.outcomeStatus}
              onChange={(value) => updateFilter('outcomeStatus', value)}
            />
            <SortDropdown
              value={filters.sort}
              onChange={(value) => updateFilter('sort', value)}
            />
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onReset}
            className="text-sm flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Search (always visible) */}
      <SearchInput
        value={filters.search}
        onChange={(value) => updateFilter('search', value)}
      />

      {/* Filters */}
      <div className="space-y-4">
        <CategoryFilter
          value={filters.category}
          onChange={(value) => updateFilter('category', value)}
        />
        <ProjectFilter
          value={filters.project}
          onChange={(value) => updateFilter('project', value)}
        />
        <TagFilter
          value={filters.tags}
          onChange={(value) => updateFilter('tags', value)}
        />
        <ConfidenceFilter
          min={filters.confidenceMin}
          max={filters.confidenceMax}
          onChange={(min, max) => {
            onChange({ ...filters, confidenceMin: min, confidenceMax: max });
          }}
        />
        <OutcomeFilter
          value={filters.outcomeStatus}
          onChange={(value) => updateFilter('outcomeStatus', value)}
        />
        <SortDropdown
          value={filters.sort}
          onChange={(value) => updateFilter('sort', value)}
        />
      </div>
    </div>
  );
}
