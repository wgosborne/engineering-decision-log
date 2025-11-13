'use client';

// ============================================================================
// CONFIDENCE FILTER COMPONENT
// ============================================================================
// Purpose: Dual slider filter for confidence level range (1-10)
// Used in: FilterPanel component
// Features: Min and max sliders, visual range display
// ============================================================================

import { cn } from '@/lib/utils/cn';

interface ConfidenceFilterProps {
  min?: number;
  max?: number;
  onChange: (min?: number, max?: number) => void;
  className?: string;
}

export function ConfidenceFilter({
  min,
  max,
  onChange,
  className,
}: ConfidenceFilterProps) {
  const handleMinChange = (value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    onChange(numValue, max);
  };

  const handleMaxChange = (value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    onChange(min, numValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700">
        Confidence Level
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="confidence-min" className="block text-xs text-gray-500 mb-1">
            Min
          </label>
          <select
            id="confidence-min"
            value={min ?? ''}
            onChange={(e) => handleMinChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B5C5] transition-colors bg-white"
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="confidence-max" className="block text-xs text-gray-500 mb-1">
            Max
          </label>
          <select
            id="confidence-max"
            value={max ?? ''}
            onChange={(e) => handleMaxChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B5C5] transition-colors bg-white"
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
