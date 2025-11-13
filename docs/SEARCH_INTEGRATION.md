# Search Frontend Integration Guide

Complete guide for integrating search and filter functionality in your React frontend.

## Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Using useSearch Hook](#using-usesearch-hook)
- [Building Search UI](#building-search-ui)
- [Implementing Filters](#implementing-filters)
- [Pagination Patterns](#pagination-patterns)
- [Search Helpers](#search-helpers)
- [Complete Examples](#complete-examples)
- [Best Practices](#best-practices)
- [Performance Tips](#performance-tips)

---

## Overview

This guide shows you how to integrate search functionality using:
- **`useSearch` hook** - Comprehensive state management for search
- **Search helpers** - Utility functions for display and formatting
- **Search types** - TypeScript types for type safety

All code examples use React with TypeScript and Next.js App Router.

---

## Quick Start

### Minimal Search Component

```tsx
'use client';

import { useSearch } from '@/lib/hooks/useSearch';

export default function SearchPage() {
  const {
    // State
    filters,
    results,
    isLoading,
    error,

    // Actions
    setSearchTerm,
    executeSearch,
  } = useSearch();

  return (
    <div>
      <input
        value={filters.search || ''}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search decisions..."
      />

      <button onClick={executeSearch} disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Search'}
      </button>

      {error && <p className="error">{error}</p>}

      <div>
        {results.map((decision) => (
          <div key={decision.id}>
            <h3>{decision.title}</h3>
            <p>{decision.context}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Using useSearch Hook

The `useSearch` hook provides comprehensive state management for search and filters.

### Import

```tsx
import { useSearch } from '@/lib/hooks/useSearch';
```

### Basic Usage

```tsx
function SearchComponent() {
  const search = useSearch();

  // Access state
  console.log(search.filters);   // Current filters
  console.log(search.results);   // Search results
  console.log(search.total);     // Total matching results
  console.log(search.isLoading); // Loading state
  console.log(search.error);     // Error message

  // Use actions
  search.setSearchTerm('database');
  search.executeSearch();
}
```

### With Initial Filters

```tsx
function CategoryPage() {
  // Start with category pre-filtered
  const search = useSearch({
    category: 'architecture',
    sort: 'confidence-desc',
    limit: 50,
  });

  // Execute search on mount
  useEffect(() => {
    search.executeSearch();
  }, []);
}
```

### State Properties

```tsx
const {
  // Filters
  filters,          // SearchFilters - Current filter state

  // Results
  results,          // Decision[] - Search results for current page
  total,            // number - Total results across all pages
  hasMore,          // boolean - More results available?
  metadata,         // SearchMetadata - Filter dropdown options

  // UI State
  isLoading,        // boolean - Is search in progress?
  error,            // string | null - Error message if failed
  hasSearched,      // boolean - Has search been executed yet?
} = useSearch();
```

### Action Methods

```tsx
const {
  // Filter setters (auto-reset offset to 0)
  setSearchTerm,        // (term: string) => void
  setCategory,          // (category?: DecisionCategory) => void
  setProject,           // (project?: string) => void
  setTags,              // (tags: string[]) => void
  setConfidenceRange,   // (min?: number, max?: number) => void
  setOutcomeStatus,     // (status: 'all' | 'pending' | 'success' | 'failed') => void
  setFlagged,           // (flagged?: boolean) => void
  setSort,              // (sort: SortOption) => void

  // Pagination
  setLimit,             // (limit: number) => void
  setOffset,            // (offset: number) => void
  nextPage,             // () => void
  prevPage,             // () => void

  // Bulk operations
  setFilters,           // (filters: Partial<SearchFilters>) => void
  resetFilters,         // () => void

  // Search execution
  executeSearch,        // () => Promise<void>
  refresh,              // () => Promise<void> - Re-execute current search
} = useSearch();
```

### Auto-search on Filter Change

By default, `useSearch` does NOT auto-execute searches. You must call `executeSearch()` manually.

To enable auto-search, uncomment this in `lib/hooks/useSearch.ts`:

```tsx
// In useSearch.ts, uncomment:
useEffect(() => {
  executeSearch();
}, [executeSearch]);
```

**Pros:** Instant results when filters change
**Cons:** More API calls, may be too aggressive

**Recommended:** Keep manual search for better control.

---

## Building Search UI

### Search Input

```tsx
function SearchInput() {
  const { filters, setSearchTerm, executeSearch } = useSearch();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  return (
    <div className="search-input">
      <input
        type="text"
        value={filters.search || ''}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Search decisions..."
        className="input"
      />
      <button onClick={executeSearch}>
        Search
      </button>
    </div>
  );
}
```

### Search with Loading State

```tsx
function SearchInput() {
  const { filters, setSearchTerm, executeSearch, isLoading } = useSearch();

  return (
    <div className="search-input">
      <input
        type="text"
        value={filters.search || ''}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={isLoading}
      />
      <button onClick={executeSearch} disabled={isLoading}>
        {isLoading ? (
          <>
            <Spinner />
            Searching...
          </>
        ) : (
          'Search'
        )}
      </button>
    </div>
  );
}
```

### Search Results Display

```tsx
function SearchResults() {
  const { results, total, isLoading, error, hasSearched } = useSearch();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!hasSearched) {
    return <div>Enter a search term to begin</div>;
  }

  if (results.length === 0) {
    return <div>No results found</div>;
  }

  return (
    <div>
      <p>{total} decisions found</p>

      {results.map((decision) => (
        <DecisionCard key={decision.id} decision={decision} />
      ))}
    </div>
  );
}
```

### Search Summary

Display active filters using helper functions:

```tsx
import { getSearchSummary, areFiltersApplied } from '@/lib/utils/search-helpers';

function SearchSummary() {
  const { filters, total, resetFilters } = useSearch();

  const summary = getSearchSummary(filters);
  const hasFilters = areFiltersApplied(filters);

  return (
    <div className="search-summary">
      <p>{summary.description}</p>
      <p>Found {total} decisions</p>

      {hasFilters && (
        <button onClick={resetFilters}>
          Clear all filters
        </button>
      )}

      <div className="active-filters">
        {summary.filters.map((filter) => (
          <span key={filter.type} className="filter-badge">
            {filter.label}: {filter.value}
          </span>
        ))}
      </div>
    </div>
  );
}
```

---

## Implementing Filters

### Category Filter

```tsx
function CategoryFilter() {
  const { filters, metadata, setCategory } = useSearch();

  return (
    <select
      value={filters.category || ''}
      onChange={(e) => setCategory(e.target.value || undefined)}
    >
      <option value="">All Categories</option>
      {metadata.availableCategories.map((cat) => (
        <option key={cat} value={cat}>
          {CATEGORY_LABELS[cat]}
        </option>
      ))}
    </select>
  );
}
```

### Project Filter

```tsx
function ProjectFilter() {
  const { filters, metadata, setProject } = useSearch();

  return (
    <select
      value={filters.project || ''}
      onChange={(e) => setProject(e.target.value || undefined)}
    >
      <option value="">All Projects</option>
      {metadata.availableProjects.map((project) => (
        <option key={project} value={project}>
          {project}
        </option>
      ))}
    </select>
  );
}
```

### Tag Filter (Multi-select)

```tsx
function TagFilter() {
  const { filters, metadata, setTags } = useSearch();

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];

    if (currentTags.includes(tag)) {
      // Remove tag
      setTags(currentTags.filter((t) => t !== tag));
    } else {
      // Add tag
      setTags([...currentTags, tag]);
    }
  };

  return (
    <div className="tag-filter">
      <label>Tags:</label>
      <div className="tag-list">
        {metadata.availableTags.map((tag) => (
          <label key={tag} className="tag-checkbox">
            <input
              type="checkbox"
              checked={filters.tags?.includes(tag) || false}
              onChange={() => handleTagToggle(tag)}
            />
            {tag}
          </label>
        ))}
      </div>
    </div>
  );
}
```

### Confidence Range Filter

```tsx
function ConfidenceFilter() {
  const { filters, metadata, setConfidenceRange } = useSearch();

  const min = filters.confidenceMin || 1;
  const max = filters.confidenceMax || 10;

  return (
    <div className="confidence-filter">
      <label>Confidence: {min} - {max}</label>

      <div className="range-inputs">
        <input
          type="range"
          min={1}
          max={10}
          value={min}
          onChange={(e) => setConfidenceRange(parseInt(e.target.value), max)}
        />

        <input
          type="range"
          min={1}
          max={10}
          value={max}
          onChange={(e) => setConfidenceRange(min, parseInt(e.target.value))}
        />
      </div>

      {metadata.confidenceRange && (
        <p className="hint">
          Your decisions range from {metadata.confidenceRange.min} to {metadata.confidenceRange.max}
        </p>
      )}
    </div>
  );
}
```

### Outcome Status Filter

```tsx
function OutcomeFilter() {
  const { filters, metadata, setOutcomeStatus } = useSearch();

  return (
    <div className="outcome-filter">
      <label>Outcome:</label>

      <select
        value={filters.outcomeStatus || 'all'}
        onChange={(e) => setOutcomeStatus(e.target.value as any)}
      >
        <option value="all">
          All ({metadata.outcomeStats?.total || 0})
        </option>
        <option value="pending">
          Pending ({metadata.outcomeStats?.pending || 0})
        </option>
        <option value="success">
          Success ({metadata.outcomeStats?.success || 0})
        </option>
        <option value="failed">
          Failed ({metadata.outcomeStats?.failed || 0})
        </option>
      </select>
    </div>
  );
}
```

### Flagged Filter

```tsx
function FlaggedFilter() {
  const { filters, setFlagged } = useSearch();

  return (
    <div className="flagged-filter">
      <label>
        <input
          type="checkbox"
          checked={filters.flagged === true}
          onChange={(e) => setFlagged(e.target.checked || undefined)}
        />
        Show only flagged decisions
      </label>
    </div>
  );
}
```

### Sort Options

```tsx
import { getSortLabel } from '@/lib/utils/search-helpers';

function SortSelector() {
  const { filters, setSort } = useSearch();

  const sortOptions: SortOption[] = [
    'date-desc',
    'date-asc',
    'confidence-desc',
    'confidence-asc',
    'relevance',
  ];

  return (
    <select
      value={filters.sort || 'date-desc'}
      onChange={(e) => setSort(e.target.value as SortOption)}
    >
      {sortOptions.map((option) => (
        <option key={option} value={option}>
          {getSortLabel(option)}
        </option>
      ))}
    </select>
  );
}
```

---

## Pagination Patterns

### Basic Pagination

```tsx
import { formatResultCount, getPageNumber, getTotalPages } from '@/lib/utils/search-helpers';

function Pagination() {
  const { filters, results, total, hasMore, nextPage, prevPage } = useSearch();

  const currentPage = getPageNumber(filters.offset || 0, filters.limit || 20);
  const totalPages = getTotalPages(total, filters.limit || 20);

  const canGoPrev = (filters.offset || 0) > 0;
  const canGoNext = hasMore;

  return (
    <div className="pagination">
      <p>
        {formatResultCount(
          filters.offset || 0,
          filters.limit || 20,
          total,
          results.length
        )}
      </p>

      <div className="pagination-controls">
        <button onClick={prevPage} disabled={!canGoPrev}>
          Previous
        </button>

        <span>
          Page {currentPage} of {totalPages}
        </span>

        <button onClick={nextPage} disabled={!canGoNext}>
          Next
        </button>
      </div>
    </div>
  );
}
```

### Load More Button

```tsx
function LoadMorePagination() {
  const { results, hasMore, nextPage, isLoading } = useSearch();

  if (results.length === 0) return null;

  return (
    <div className="load-more">
      {hasMore && (
        <button onClick={nextPage} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}

      {!hasMore && (
        <p>No more results</p>
      )}
    </div>
  );
}
```

### Infinite Scroll

```tsx
import { useEffect, useRef } from 'react';

function InfiniteScrollResults() {
  const { results, hasMore, nextPage, isLoading } = useSearch();
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          nextPage();
        }
      },
      { threshold: 1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, nextPage]);

  return (
    <div>
      {results.map((decision) => (
        <DecisionCard key={decision.id} decision={decision} />
      ))}

      {hasMore && (
        <div ref={observerTarget} className="loading-trigger">
          {isLoading && <Spinner />}
        </div>
      )}
    </div>
  );
}
```

### Page Number Navigation

```tsx
function PageNavigation() {
  const { filters, total, setOffset } = useSearch();

  const limit = filters.limit || 20;
  const currentPage = getPageNumber(filters.offset || 0, limit);
  const totalPages = getTotalPages(total, limit);

  const goToPage = (page: number) => {
    const newOffset = (page - 1) * limit;
    setOffset(newOffset);
  };

  // Show 5 page numbers at a time
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <div className="page-navigation">
      <button
        onClick={() => goToPage(1)}
        disabled={currentPage === 1}
      >
        First
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => goToPage(page)}
          className={page === currentPage ? 'active' : ''}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => goToPage(totalPages)}
        disabled={currentPage === totalPages}
      >
        Last
      </button>
    </div>
  );
}
```

---

## Search Helpers

The `search-helpers.ts` file provides utility functions for common UI tasks.

### Import

```tsx
import {
  getSearchSummary,
  areFiltersApplied,
  formatSearchTerm,
  formatTags,
  formatConfidenceRange,
  buildQueryString,
  parseQueryString,
  formatResultCount,
  clearFilters,
  clearFilterType,
  getSortLabel,
} from '@/lib/utils/search-helpers';
```

### Display Search Summary

```tsx
const summary = getSearchSummary(filters);

console.log(summary.description);
// "Showing architecture decisions with tags [react, typescript]"

console.log(summary.activeFilterCount);
// 2

summary.filters.forEach((filter) => {
  console.log(`${filter.label}: ${filter.value}`);
  // "Category: Architecture"
  // "Tags: react, typescript"
});
```

### Check If Filters Applied

```tsx
if (areFiltersApplied(filters)) {
  // Show "Clear Filters" button
}
```

### Format Display Values

```tsx
// Truncate long search terms
const displayTerm = formatSearchTerm(filters.search, 30);
// "This is a very long search t..."

// Format tag list
const displayTags = formatTags(filters.tags, 3);
// "react, typescript, database, +5 more"

// Format confidence range
const displayConfidence = formatConfidenceRange(7, 10);
// "7-10"

const displayMin = formatConfidenceRange(7);
// "≥7"
```

### URL Query String Handling

Useful for bookmarkable search URLs:

```tsx
// Build URL with filters
const queryString = buildQueryString(filters);
const url = `/decisions?${queryString}`;
// /decisions?search=database&category=technical&confidence_min=7

// Parse URL to filters
const urlFilters = parseQueryString(window.location.search);
const search = useSearch(urlFilters);
```

### Clear Filters

```tsx
// Clear all filters
const cleared = clearFilters();
setFilters(cleared);

// Clear specific filter
const withoutCategory = clearFilterType(filters, 'category');
setFilters(withoutCategory);
```

---

## Complete Examples

### Complete Search Page

```tsx
'use client';

import { useEffect } from 'react';
import { useSearch } from '@/lib/hooks/useSearch';
import { getSearchSummary, formatResultCount } from '@/lib/utils/search-helpers';
import { CATEGORY_LABELS } from '@/lib/types/decisions';

export default function SearchPage() {
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
    setProject,
    setTags,
    setConfidenceRange,
    setSort,
    executeSearch,
    resetFilters,
    nextPage,
    prevPage,
  } = useSearch();

  const summary = getSearchSummary(filters);
  const canGoPrev = (filters.offset || 0) > 0;

  // Execute search on mount
  useEffect(() => {
    executeSearch();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  return (
    <div className="search-page">
      <h1>Search Decisions</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search decisions..."
          className="search-input"
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.category || ''}
          onChange={(e) => setCategory(e.target.value || undefined)}
        >
          <option value="">All Categories</option>
          {metadata.availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>

        <select
          value={filters.project || ''}
          onChange={(e) => setProject(e.target.value || undefined)}
        >
          <option value="">All Projects</option>
          {metadata.availableProjects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>

        <button onClick={resetFilters}>Clear Filters</button>
      </div>

      {/* Search Summary */}
      {hasSearched && (
        <div className="search-summary">
          <p>{summary.description}</p>
          <p>
            {formatResultCount(
              filters.offset || 0,
              filters.limit || 20,
              total,
              results.length
            )}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length === 0 && hasSearched && (
        <div className="no-results">
          No decisions found
        </div>
      )}

      <div className="results">
        {results.map((decision) => (
          <article key={decision.id} className="decision-card">
            <h3>{decision.title}</h3>
            <p>{decision.context}</p>
            <div className="meta">
              <span className="category">{decision.category}</span>
              <span className="confidence">
                Confidence: {decision.confidence_level}/10
              </span>
              {decision.tags && decision.tags.length > 0 && (
                <div className="tags">
                  {decision.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Pagination */}
      {results.length > 0 && (
        <div className="pagination">
          <button onClick={prevPage} disabled={!canGoPrev || isLoading}>
            Previous
          </button>

          <button onClick={nextPage} disabled={!hasMore || isLoading}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

### Sidebar Filter Panel

```tsx
function FilterSidebar() {
  const {
    filters,
    metadata,
    setCategory,
    setProject,
    setConfidenceRange,
    setOutcomeStatus,
    setFlagged,
    setSort,
    resetFilters,
  } = useSearch();

  return (
    <aside className="filter-sidebar">
      <div className="filter-header">
        <h2>Filters</h2>
        <button onClick={resetFilters}>Clear All</button>
      </div>

      {/* Category */}
      <div className="filter-section">
        <label>Category</label>
        <select
          value={filters.category || ''}
          onChange={(e) => setCategory(e.target.value || undefined)}
        >
          <option value="">All</option>
          {metadata.availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Project */}
      <div className="filter-section">
        <label>Project</label>
        <select
          value={filters.project || ''}
          onChange={(e) => setProject(e.target.value || undefined)}
        >
          <option value="">All</option>
          {metadata.availableProjects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>
      </div>

      {/* Confidence Range */}
      <div className="filter-section">
        <label>
          Confidence: {filters.confidenceMin || 1} - {filters.confidenceMax || 10}
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={filters.confidenceMin || 1}
          onChange={(e) =>
            setConfidenceRange(parseInt(e.target.value), filters.confidenceMax)
          }
        />
        <input
          type="range"
          min={1}
          max={10}
          value={filters.confidenceMax || 10}
          onChange={(e) =>
            setConfidenceRange(filters.confidenceMin, parseInt(e.target.value))
          }
        />
      </div>

      {/* Outcome */}
      <div className="filter-section">
        <label>Outcome</label>
        <select
          value={filters.outcomeStatus || 'all'}
          onChange={(e) => setOutcomeStatus(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Flagged */}
      <div className="filter-section">
        <label>
          <input
            type="checkbox"
            checked={filters.flagged === true}
            onChange={(e) => setFlagged(e.target.checked || undefined)}
          />
          Only flagged
        </label>
      </div>

      {/* Sort */}
      <div className="filter-section">
        <label>Sort by</label>
        <select
          value={filters.sort || 'date-desc'}
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="confidence-desc">Highest confidence</option>
          <option value="confidence-asc">Lowest confidence</option>
          <option value="relevance">Most relevant</option>
        </select>
      </div>
    </aside>
  );
}
```

---

## Best Practices

### 1. Reset Offset When Changing Filters

Always reset to page 1 when users change filters:

```tsx
// GOOD: setCategory automatically resets offset to 0
setCategory('architecture');

// BAD: Manually setting filters without resetting offset
setFilters({ ...filters, category: 'architecture' });
// User might be on page 5, sees confusing results
```

The individual setter functions (`setCategory`, `setProject`, etc.) handle this automatically.

### 2. Show Loading States

Always provide feedback during searches:

```tsx
{isLoading ? (
  <Spinner />
) : (
  <ResultsList results={results} />
)}
```

### 3. Handle Empty States

Distinguish between different empty states:

```tsx
if (!hasSearched) {
  return <p>Enter a search term to begin</p>;
}

if (isLoading) {
  return <Spinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}

if (results.length === 0) {
  return <NoResults filters={filters} />;
}
```

### 4. Debounce Search Input

Prevent excessive API calls on every keystroke:

```tsx
import { useDebouncedCallback } from 'use-debounce';

function SearchInput() {
  const { setSearchTerm, executeSearch } = useSearch();

  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      setSearchTerm(value);
      executeSearch();
    },
    500 // 500ms delay
  );

  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### 5. Use TypeScript Types

Import types for type safety:

```tsx
import type { SearchFilters, SortOption } from '@/lib/types/search';
import type { DecisionCategory } from '@/lib/types/decisions';

function MyComponent() {
  const [category, setCategory] = useState<DecisionCategory | undefined>();
  const [sort, setSort] = useState<SortOption>('date-desc');
}
```

### 6. Cache Search Results

Use React Query or SWR for caching:

```tsx
import { useQuery } from '@tanstack/react-query';

function useSearchWithCache(filters: SearchFilters) {
  return useQuery({
    queryKey: ['decisions', filters],
    queryFn: () => fetchDecisions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 7. URL Sync for Bookmarkable Searches

Sync filters with URL:

```tsx
import { useSearchParams } from 'next/navigation';
import { parseQueryString, buildQueryString } from '@/lib/utils/search-helpers';

function SearchPage() {
  const searchParams = useSearchParams();

  // Initialize from URL
  const initialFilters = parseQueryString(searchParams.toString());
  const search = useSearch(initialFilters);

  // Update URL when filters change
  useEffect(() => {
    const queryString = buildQueryString(search.filters);
    window.history.pushState({}, '', `?${queryString}`);
  }, [search.filters]);
}
```

---

## Performance Tips

### 1. Use Pagination

Don't load all results at once:

```tsx
// GOOD: Paginated results
const search = useSearch({ limit: 20 });

// BAD: Loading hundreds of results
const search = useSearch({ limit: 1000 });
```

### 2. Lazy Load Metadata

Only fetch metadata when needed:

```tsx
// Metadata is included in every search response
// No need for separate API call
const { metadata } = useSearch();
```

### 3. Memoize Expensive Computations

```tsx
import { useMemo } from 'react';

function SearchResults() {
  const { results } = useSearch();

  const processedResults = useMemo(() => {
    return results.map((decision) => ({
      ...decision,
      // Expensive computation
      score: calculateRelevanceScore(decision),
    }));
  }, [results]);

  return <ResultsList results={processedResults} />;
}
```

### 4. Virtualize Long Lists

For very long result lists, use virtualization:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedResults() {
  const { results } = useSearch();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.key} style={...}>
            <DecisionCard decision={results[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Prefetch Next Page

Improve perceived performance:

```tsx
function SearchResults() {
  const { results, hasMore, filters } = useSearch();

  useEffect(() => {
    if (hasMore) {
      // Prefetch next page
      const nextOffset = (filters.offset || 0) + (filters.limit || 20);
      fetch(`/api/decisions?${buildQueryString({ ...filters, offset: nextOffset })}`);
    }
  }, [hasMore, filters]);

  return <ResultsList results={results} />;
}
```

---

## Next Steps

- **API Reference**: Read [SEARCH_API.md](./SEARCH_API.md) for complete API documentation
- **Configuration**: Read [SEARCH_CONFIGURATION.md](./SEARCH_CONFIGURATION.md) for full-text search details
- **Hooks Source**: Review `lib/hooks/useSearch.ts` to understand internal implementation
- **Helpers Source**: Review `lib/utils/search-helpers.ts` for additional utility functions

---

## Additional Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Query](https://tanstack.com/query/latest) - For advanced caching
- [React Virtual](https://tanstack.com/virtual/latest) - For list virtualization
