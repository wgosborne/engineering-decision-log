// ============================================================================
// BADGE COMPONENT
// ============================================================================
// Purpose: Reusable badge for tags, categories, status indicators
// Variants: default, success, warning, info, accent (pink)
// ============================================================================

import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-700 border-gray-200',
        secondary: 'bg-gray-100 text-gray-700 border-gray-200',
        success: 'bg-green-50 text-green-700 border-green-200',
        danger: 'bg-red-50 text-red-700 border-red-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
        accent: 'bg-[#FFF5FA] text-[#FF80B8] border-[#FF99C8]',
        violet: 'bg-[#F3EFFF] text-[#8B5CF6] border-[#8B5CF6]',
        orchid: 'bg-[#FDF4FF] text-[#DA70D6] border-[#DA70D6]',
        coral: 'bg-[#FFF5F5] text-[#FF6B6B] border-[#FF6B6B]',
        teal: 'bg-[#F0FDFA] text-[#14B8A6] border-[#14B8A6]',
        amber: 'bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]',
        sky: 'bg-[#F0F9FF] text-[#0EA5E9] border-[#0EA5E9]',
        emerald: 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]',
        rose: 'bg-[#FFF1F2] text-[#FB7185] border-[#FB7185]',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs rounded',
        md: 'px-2.5 py-1 text-sm rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: LucideIcon;
}

export function Badge({
  className,
  variant,
  size,
  icon: Icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
