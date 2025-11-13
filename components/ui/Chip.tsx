// ============================================================================
// CHIP COMPONENT
// ============================================================================
// Purpose: Selected filter chip with remove button (X)
// Used in filter panels to show active filters
// ============================================================================

import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ChipProps {
  label: string;
  onRemove?: () => void;
  variant?: 'filter' | 'accent' | 'violet' | 'orchid' | 'teal' | 'coral';
  className?: string;
}

export function Chip({
  label,
  onRemove,
  variant = 'filter',
  className,
}: ChipProps) {
  const variantStyles = {
    filter: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    accent: 'bg-[#FFF5FA] text-[#FF80B8] border border-[#FF99C8]',
    violet: 'bg-[#F3EFFF] text-[#8B5CF6] border border-[#8B5CF6]',
    orchid: 'bg-[#FDF4FF] text-[#DA70D6] border border-[#DA70D6]',
    teal: 'bg-[#F0FDFA] text-[#14B8A6] border border-[#14B8A6]',
    coral: 'bg-[#FFF5F5] text-[#FF6B6B] border border-[#FF6B6B]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-md transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="inline-flex items-center justify-center hover:opacity-70 transition-opacity"
          aria-label={`Remove ${label}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}
