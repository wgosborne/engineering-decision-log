'use client';

// ============================================================================
// CATEGORY FILTER COMPONENT
// ============================================================================
// Purpose: Multi-select checkbox filter for decision categories
// Used in: FilterPanel component
// Features: Checkbox list of all decision categories with counts
// ============================================================================

import { cn } from '@/lib/utils/cn';
import { DecisionCategory, CATEGORY_LABELS } from '@/lib/types/decisions';

interface CategoryFilterProps {
  value?: DecisionCategory;
  onChange: (category: DecisionCategory | undefined) => void;
  className?: string;
}

export function CategoryFilter({
  value,
  onChange,
  className,
}: CategoryFilterProps) {
  const categories = Object.values(DecisionCategory);

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor="category-filter"
        className="block text-sm font-medium text-gray-700"
      >
        Category
      </label>
      <select
        id="category-filter"
        value={value || ''}
        onChange={(e) =>
          onChange(e.target.value ? (e.target.value as DecisionCategory) : undefined)
        }
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B5C5] transition-colors bg-white"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {CATEGORY_LABELS[cat]}
          </option>
        ))}
      </select>
    </div>
  );
}
