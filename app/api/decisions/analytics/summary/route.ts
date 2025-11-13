// ============================================================================
// API ROUTE: /api/decisions/analytics/summary
// ============================================================================
// Methods: GET
// Purpose: Return aggregated analytics data for dashboard and pattern analysis
// ============================================================================

import { NextRequest } from 'next/server';
import { getAnalyticsSummary } from '@/lib/api/decisions-service';
import { DecisionCategory } from '@/lib/types/decisions';
import {
  successResponse,
  badRequestResponse,
  handleApiError,
} from '@/lib/api/responses';

// ============================================================================
// GET /api/decisions/analytics/summary - Get analytics summary
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;

    const period = searchParams.get('period') as 'week' | 'month' | 'quarter' | 'all' | null;
    const category = searchParams.get('category') as DecisionCategory | null;

    // Validate period parameter
    if (period && !['week', 'month', 'quarter', 'all'].includes(period)) {
      return badRequestResponse('period must be one of: week, month, quarter, all');
    }

    // Fetch analytics summary
    const summary = await getAnalyticsSummary(
      period || 'month',
      category || undefined
    );

    return successResponse(summary);
  } catch (error) {
    console.error('Error in GET /api/decisions/analytics/summary:', error);
    return handleApiError(error);
  }
}
