// ============================================================================
// API ROUTE: /api/decisions
// ============================================================================
// Methods: POST (create), GET (list with filtering)
// Purpose: Create new decisions and list/search existing decisions
// ============================================================================

import { NextRequest } from 'next/server';
import { createDecision, listDecisions } from '@/lib/api/decisions-service';
import { validateCreateDecision } from '@/lib/api/validation';
import {
  createdResponse,
  validationErrorResponse,
  badRequestResponse,
  handleApiError,
  successResponse,
} from '@/lib/api/responses';
import { DecisionCategory } from '@/lib/types/decisions';
import { getSearchMetadata } from '@/lib/supabase/queries';

// ============================================================================
// POST /api/decisions - Create new decision
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = validateCreateDecision(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    // Create decision
    const decision = await createDecision(body);

    // Return created decision
    return createdResponse(decision);
  } catch (error) {
    console.error('Error in POST /api/decisions:', error);
    return handleApiError(error);
  }
}

// ============================================================================
// GET /api/decisions - List decisions with filtering
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') as DecisionCategory | undefined;
    const project = searchParams.get('project') || undefined;

    // Parse tags (comma-separated)
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()) : undefined;

    // Parse confidence range
    const confidenceMin = searchParams.get('confidence_min');
    const confidenceMax = searchParams.get('confidence_max');

    const confidence_min = confidenceMin ? parseInt(confidenceMin, 10) : undefined;
    const confidence_max = confidenceMax ? parseInt(confidenceMax, 10) : undefined;

    // Validate confidence range
    if (confidence_min !== undefined && (isNaN(confidence_min) || confidence_min < 1 || confidence_min > 10)) {
      return badRequestResponse('confidence_min must be an integer between 1 and 10');
    }

    if (confidence_max !== undefined && (isNaN(confidence_max) || confidence_max < 1 || confidence_max > 10)) {
      return badRequestResponse('confidence_max must be an integer between 1 and 10');
    }

    if (confidence_min !== undefined && confidence_max !== undefined && confidence_min > confidence_max) {
      return badRequestResponse('confidence_min cannot be greater than confidence_max');
    }

    // Parse outcome status
    const outcome_status = searchParams.get('outcome_status') as 'all' | 'pending' | 'success' | 'failed' | undefined;

    if (outcome_status && !['all', 'pending', 'success', 'failed'].includes(outcome_status)) {
      return badRequestResponse('outcome_status must be one of: all, pending, success, failed');
    }

    // Parse flagged filter
    const flaggedParam = searchParams.get('flagged');
    const flagged = flaggedParam ? flaggedParam === 'true' : undefined;

    // Parse sort
    const sort = searchParams.get('sort') as 'date-desc' | 'date-asc' | 'confidence-desc' | 'confidence-asc' | undefined;

    if (sort && !['date-desc', 'date-asc', 'confidence-desc', 'confidence-asc'].includes(sort)) {
      return badRequestResponse('sort must be one of: date-desc, date-asc, confidence-desc, confidence-asc');
    }

    // Parse pagination
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return badRequestResponse('limit must be an integer between 1 and 100');
    }

    if (isNaN(offset) || offset < 0) {
      return badRequestResponse('offset must be a non-negative integer');
    }

    // Build query parameters
    const params = {
      search,
      category,
      project,
      tags,
      confidence_min,
      confidence_max,
      outcome_status: outcome_status || 'all',
      flagged,
      sort: sort || 'date-desc',
      limit,
      offset,
    };

    // Fetch decisions and metadata in parallel
    const [result, metadata] = await Promise.all([
      listDecisions(params),
      getSearchMetadata(),
    ]);

    // Return results with metadata
    return successResponse({
      decisions: result.decisions,
      total: result.total,
      hasMore: result.hasMore,
      limit,
      offset,
      metadata,
    });
  } catch (error) {
    console.error('Error in GET /api/decisions:', error);
    return handleApiError(error);
  }
}
