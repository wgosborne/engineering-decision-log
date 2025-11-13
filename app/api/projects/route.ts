// ============================================================================
// API ROUTE: /api/projects
// ============================================================================
// Methods: GET
// Purpose: Get list of distinct project names for autocomplete
// ============================================================================

import { NextRequest } from 'next/server';
import { getDistinctProjects } from '@/lib/supabase/queries';
import { successResponse, handleApiError } from '@/lib/api/responses';

// ============================================================================
// GET /api/projects - Get distinct project names
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const projects = await getDistinctProjects();
    return successResponse(projects);
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return handleApiError(error);
  }
}
