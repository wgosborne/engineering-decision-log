// ============================================================================
// API ROUTE: /api/decisions/[id]/flag-for-review
// ============================================================================
// Methods: PUT
// Purpose: Flag or unflag a decision for review
// ============================================================================

import { NextRequest } from 'next/server';
import { flagDecisionForReview, isValidUUID } from '@/lib/api/decisions-service';
import { validateFlagForReview } from '@/lib/api/validation';
import {
  successResponse,
  validationErrorResponse,
  badRequestResponse,
  handleApiError,
} from '@/lib/api/responses';

// ============================================================================
// PUT /api/decisions/[id]/flag-for-review - Flag decision for review
// ============================================================================

export async function PUT(
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
    const validation = validateFlagForReview(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    // Flag decision for review
    const updatedDecision = await flagDecisionForReview(id, body);

    return successResponse(updatedDecision);
  } catch (error) {
    console.error('Error in PUT /api/decisions/[id]/flag-for-review:', error);
    return handleApiError(error);
  }
}
