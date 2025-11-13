// ============================================================================
// SUPABASE CLIENT
// ============================================================================
// Purpose: Initialize and export Supabase client for database operations
// Usage: Import 'supabase' from this file in services and API routes
// Setup: Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// ============================================================================

import { createClient } from '@supabase/supabase-js';

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
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

/**
 * Supabase client instance
 * Used for all database operations throughout the app
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Currently no auth, but ready for future implementation
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});

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

/**
 * Check if Supabase client is properly initialized
 * @returns True if client is ready
 */
export function isSupabaseReady(): boolean {
  try {
    return !!(supabase && supabaseUrl && supabaseAnonKey);
  } catch {
    return false;
  }
}

/**
 * Test database connection
 * @returns True if connection is successful
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('decisions').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default supabase;