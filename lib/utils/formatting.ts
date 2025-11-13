// ============================================================================
// FORMATTING UTILITIES
// ============================================================================
// Purpose: Format dates, text, numbers for consistent display
// ============================================================================

/**
 * Format date to readable string
 * @param date - Date string or Date object
 * @returns Formatted date (e.g., "Nov 9, 2025")
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date to short format
 * @param date - Date string or Date object
 * @returns Short format (e.g., "11/9/25")
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  });
}

/**
 * Format date to relative time
 * @param date - Date string or Date object
 * @returns Relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatTimeSince(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
  if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  if (diffWeek > 0) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'just now';
}

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string | undefined | null, length: number): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.substring(0, length).trim()}...`;
}

/**
 * Highlight matching text in a string
 * @param text - Text to search
 * @param query - Search query
 * @returns Text with <mark> tags around matches
 */
export function highlightMatches(text: string, query: string): string {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-100">$1</mark>');
}

/**
 * Format confidence level to display string
 * @param confidence - Confidence level (1-10)
 * @returns Formatted string (e.g., "8/10")
 */
export function formatConfidence(confidence: number | null | undefined): string {
  if (confidence === null || confidence === undefined) return 'Not set';
  return `${confidence}/10`;
}

/**
 * Format array to comma-separated string
 * @param arr - Array of strings
 * @param maxDisplay - Maximum items to display before "and X more"
 * @returns Formatted string
 */
export function formatArray(arr: string[] | null | undefined, maxDisplay: number = 3): string {
  if (!arr || arr.length === 0) return '';

  if (arr.length <= maxDisplay) {
    return arr.join(', ');
  }

  const displayed = arr.slice(0, maxDisplay).join(', ');
  const remaining = arr.length - maxDisplay;
  return `${displayed}, and ${remaining} more`;
}

/**
 * Format number with commas
 * @param num - Number to format
 * @returns Formatted number (e.g., "1,234")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format percentage
 * @param value - Decimal value (0-1)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage (e.g., "75.5%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format date to relative time (future or past)
 * @param date - Date string or Date object
 * @returns Relative time (e.g., "in 2 days", "3 days ago")
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.floor(Math.abs(diffMs) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const isPast = diffMs < 0;
  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';

  if (diffYear > 0) return `${prefix}${diffYear} year${diffYear > 1 ? 's' : ''}${suffix}`;
  if (diffMonth > 0) return `${prefix}${diffMonth} month${diffMonth > 1 ? 's' : ''}${suffix}`;
  if (diffWeek > 0) return `${prefix}${diffWeek} week${diffWeek > 1 ? 's' : ''}${suffix}`;
  if (diffDay > 0) return `${prefix}${diffDay} day${diffDay > 1 ? 's' : ''}${suffix}`;
  if (diffHour > 0) return `${prefix}${diffHour} hour${diffHour > 1 ? 's' : ''}${suffix}`;
  if (diffMin > 0) return `${prefix}${diffMin} minute${diffMin > 1 ? 's' : ''}${suffix}`;
  return 'now';
}
