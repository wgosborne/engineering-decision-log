// ============================================================================
// SUPABASE CLIENT - BROWSER
// ============================================================================
// Purpose: Browser-side Supabase client with auth support
// Usage: Import 'createClient' in Client Components only
// Note: This uses cookies for session management via @supabase/ssr
// ============================================================================

import { createBrowserClient } from '@supabase/ssr';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error(
    'Missing environment variable: NEXT_PUBLIC_SUPABASE_URL\n' +
      'Please add it to your .env.local file.\n' +
      'Get this value from your Supabase project dashboard → Settings → API'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      'Please add it to your .env.local file.\n' +
      'Get this value from your Supabase project dashboard → Settings → API'
  );
}

// ============================================================================
// BROWSER CLIENT (for Client Components)
// ============================================================================

/**
 * Create a Supabase client for browser/client components
 * This client automatically manages auth sessions via cookies
 */
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}

// ============================================================================
// TYPE-SAFE DATABASE TYPES (Generated from Supabase)
// ============================================================================

/**
 * Database schema type
 * This should ideally be auto-generated using: npx supabase gen types typescript
 * For now, we rely on our manually created types in lib/types/decisions.ts
 */
export type Database = {
  public: {
    Tables: {
      decisions: {
        Row: any; // Will be replaced with generated types
        Insert: any;
        Update: any;
      };
    };
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle Supabase errors and format them consistently
 * @param error - Supabase error object
 * @returns Formatted error message
 */
export function formatSupabaseError(error: any): string {
  if (!error) return 'Unknown database error';

  // Handle common Supabase error codes
  switch (error.code) {
    case 'PGRST116':
      return 'Record not found';
    case '23505':
      return 'Duplicate entry - this record already exists';
    case '23503':
      return 'Referenced record does not exist';
    case '23502':
      return 'Required field is missing';
    case '22P02':
      return 'Invalid input format';
    default:
      return error.message || 'Database operation failed';
  }
}