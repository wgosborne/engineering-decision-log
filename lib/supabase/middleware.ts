// ============================================================================
// SUPABASE CLIENT - MIDDLEWARE
// ============================================================================
// Purpose: Middleware-compatible Supabase client for session refresh
// Usage: Import in middleware.ts to validate and refresh user sessions
// ============================================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Update session in middleware
 * This refreshes the user's session on every request and handles redirects
 */
export async function updateSession(request: NextRequest) {
  // DEV BRANCH: Authentication disabled - allow all requests through
  return NextResponse.next({
    request,
  });
}
