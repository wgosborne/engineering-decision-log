// ============================================================================
// API ROUTE: /api/decisions/[id]/similar
// ============================================================================
// Methods: POST
// Purpose: Mark a decision as similar to another decision
// ============================================================================

import { NextRequest } from 'next/server';
import { markSimilarDecision, isValidUUID } from '@/lib/api/decisions-service';
import { validateSimilarLink } from '@/lib/api/validation';
import {
  successResponse,
  validationErrorResponse,
  badRequestResponse,
  handleApiError,
} from '@/lib/api/responses';

// ============================================================================
// POST /api/decisions/[id]/similar - Link similar decisions
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return badRequestResponse('Invalid decision ID format (must be a valid UUID)');
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = validateSimilarLink(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    // Check if trying to link to itself
    if (id === body.similar_to_id) {
      return badRequestResponse('Cannot mark a decision as similar to itself');
    }

    // Mark decisions as similar
    const updatedDecision = await markSimilarDecision(id, body);

    return successResponse(updatedDecision);
  } catch (error) {
    console.error('Error in POST /api/decisions/[id]/similar:', error);
    return handleApiError(error);
  }
}
