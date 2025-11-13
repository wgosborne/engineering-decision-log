'use client';

// ============================================================================
// USE MEDIA QUERY HOOK
// ============================================================================
// Purpose: Detect screen size for responsive behavior
// Usage: const isMobile = useMediaQuery("(max-width: 768px)")
// ============================================================================

import { useState, useEffect } from 'react';

/**
 * Hook to detect if a media query matches
 * @param query - Media query string (e.g., "(max-width: 768px)")
 * @returns boolean - true if query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create media query list
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', listener);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook to detect if screen is mobile size
 * @returns boolean - true if mobile (< 640px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

/**
 * Hook to detect if screen is tablet size
 * @returns boolean - true if tablet (640px - 1024px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
}

/**
 * Hook to detect if screen is desktop size
 * @returns boolean - true if desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
