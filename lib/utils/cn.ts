// ============================================================================
// CLASS NAME UTILITY
// ============================================================================
// Purpose: Merge Tailwind classes safely without conflicts
// Usage: cn("base-class", condition && "conditional-class", props.className)
// ============================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names and resolves Tailwind conflicts
 * Example: cn("p-4", "p-2") → "p-2" (later value wins)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
