// ============================================================================
// COLOR UTILITIES
// ============================================================================
// Purpose: Map categories and tags to consistent, vibrant colors
// Usage: Import getCategoryColor and getTagColor to colorize UI elements
// ============================================================================

import { DecisionCategory } from '@/lib/types/decisions';
import type { BadgeProps } from '@/components/ui/Badge';

/**
 * Maps decision categories to specific color variants
 * Includes deep violet and orchid as requested
 */
export const CATEGORY_COLORS: Record<DecisionCategory, BadgeProps['variant']> = {
  [DecisionCategory.Architecture]: 'violet',
  [DecisionCategory.DataStorage]: 'teal',
  [DecisionCategory.ToolSelection]: 'sky',
  [DecisionCategory.Process]: 'emerald',
  [DecisionCategory.ProjectManagement]: 'amber',
  [DecisionCategory.Strategic]: 'orchid',
  [DecisionCategory.TechnicalDebt]: 'coral',
  [DecisionCategory.Performance]: 'rose',
  [DecisionCategory.Security]: 'danger',
  [DecisionCategory.Searching]: 'info',
  [DecisionCategory.UI]: 'accent',
  [DecisionCategory.Other]: 'secondary',
};

/**
 * Get the color variant for a decision category
 */
export function getCategoryColor(category: DecisionCategory): BadgeProps['variant'] {
  return CATEGORY_COLORS[category] || 'default';
}

/**
 * Available colors for tags (cycling through vibrant palette)
 */
const TAG_COLOR_PALETTE = [
  'violet',
  'orchid',
  'coral',
  'teal',
  'sky',
  'emerald',
  'rose',
  'amber',
  'accent',
] as const;

/**
 * Get a consistent color for a tag based on its name
 * Uses a simple hash to ensure the same tag always gets the same color
 */
export function getTagColor(tag: string): BadgeProps['variant'] {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Map hash to color palette index
  const index = Math.abs(hash) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index];
}

/**
 * Get confidence level color based on value (1-10)
 */
export function getConfidenceColor(level: number): string {
  if (level >= 8) return 'text-emerald-600';
  if (level >= 6) return 'text-sky-600';
  if (level >= 4) return 'text-amber-600';
  return 'text-coral-600';
}

/**
 * Get confidence level background color based on value (1-10)
 */
export function getConfidenceBackground(level: number): string {
  if (level >= 8) return 'bg-emerald-50';
  if (level >= 6) return 'bg-sky-50';
  if (level >= 4) return 'bg-amber-50';
  return 'bg-coral-50';
}
