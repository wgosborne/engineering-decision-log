'use client';

// ============================================================================
// SORT DROPDOWN COMPONENT
// ============================================================================
// Purpose: Dropdown for sorting decisions by various criteria
// Used in: FilterPanel component, decisions list page
// Features: Sort by date, confidence, or relevance (ascending/descending)
// ============================================================================

import { cn } from '@/lib/utils/cn';
import { SortOption } from '@/lib/types/search';

interface SortDropdownProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
  className?: string;
}

export function SortDropdown({ value, onChange, className }: SortDropdownProps) {
  const options: { value: SortOption; label: string }[] = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'confidence-desc', label: 'Highest Confidence' },
    { value: 'confidence-asc', label: 'Lowest Confidence' },
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor="sort-dropdown" className="block text-sm font-medium text-gray-700">
        Sort By
      </label>
      <select
        id="sort-dropdown"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B5C5] transition-colors bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
