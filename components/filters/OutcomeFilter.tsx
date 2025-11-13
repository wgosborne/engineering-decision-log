'use client';

// ============================================================================
// OUTCOME FILTER COMPONENT
// ============================================================================
// Purpose: Radio button filter for decision outcome status
// Used in: FilterPanel component
// Features: Filter by all, pending, success, or failed outcomes
// ============================================================================

import { cn } from '@/lib/utils/cn';

type OutcomeStatus = 'all' | 'pending' | 'success' | 'failed';

interface OutcomeFilterProps {
  value: OutcomeStatus;
  onChange: (status: OutcomeStatus) => void;
  className?: string;
}

export function OutcomeFilter({
  value,
  onChange,
  className,
}: OutcomeFilterProps) {
  const options: { value: OutcomeStatus; label: string }[] = [
    { value: 'all', label: 'All Outcomes' },
    { value: 'pending', label: 'Pending' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700">Outcome</label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="radio"
              name="outcome-filter"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="w-4 h-4 border-gray-300 text-[#F5B5C5] focus:ring-[#F5B5C5]"
            />
            <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
