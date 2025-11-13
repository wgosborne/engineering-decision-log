// ============================================================================
// API ROUTE: /api/decisions/[id]/outcome
// ============================================================================
// Methods: PUT
// Purpose: Update decision outcome after decision has played out
// ============================================================================

import { NextRequest } from 'next/server';
import { setDecisionOutcome, isValidUUID } from '@/lib/api/decisions-service';
import { validateOutcomeUpdate } from '@/lib/api/validation';
import {
  successResponse,
  validationErrorResponse,
  badRequestResponse,
  handleApiError,
} from '@/lib/api/responses';

// ============================================================================
// PUT /api/decisions/[id]/outcome - Update decision outcome
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
    const validation = validateOutcomeUpdate(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    // Update outcome
    const updatedDecision = await setDecisionOutcome(id, body);

    return successResponse(updatedDecision);
  } catch (error) {
    console.error('Error in PUT /api/decisions/[id]/outcome:', error);
    return handleApiError(error);
  }
}
