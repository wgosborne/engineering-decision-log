// ============================================================================
// API ROUTE: /api/decisions/[id]
// ============================================================================
// Methods: GET (single), PUT (update), DELETE (remove)
// Purpose: Get, update, or delete a specific decision by ID
// ============================================================================

import { NextRequest } from 'next/server';
import {
  getDecisionById,
  updateDecision,
  deleteDecision,
  isValidUUID,
} from '@/lib/api/decisions-service';
import { validateUpdateDecision } from '@/lib/api/validation';
import {
  successResponse,
  validationErrorResponse,
  badRequestResponse,
  notFoundResponse,
  deletedResponse,
  handleApiError,
} from '@/lib/api/responses';

// ============================================================================
// GET /api/decisions/[id] - Get single decision
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return badRequestResponse('Invalid decision ID format (must be a valid UUID)');
    }

    // Fetch decision
    const decision = await getDecisionById(id);

    if (!decision) {
      return notFoundResponse('Decision', id);
    }

    return successResponse(decision);
  } catch (error) {
    console.error('Error in GET /api/decisions/[id]:', error);
    return handleApiError(error);
  }
}

// ============================================================================
// PUT /api/decisions/[id] - Update decision
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

    // Prevent updating protected fields
    const protectedFields = ['id', 'date_created', 'search_vector'];
    const hasProtectedFields = protectedFields.some((field) => field in body);

    if (hasProtectedFields) {
      return badRequestResponse(
        `Cannot update protected fields: ${protectedFields.join(', ')}`
      );
    }

    // Validate update data
    const validation = validateUpdateDecision(body);
    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    // Check if decision exists
    const existingDecision = await getDecisionById(id);
    if (!existingDecision) {
      return notFoundResponse('Decision', id);
    }

    // Update decision (date_updated will be auto-set by trigger)
    const updatedDecision = await updateDecision(id, body);

    return successResponse(updatedDecision);
  } catch (error) {
    console.error('Error in PUT /api/decisions/[id]:', error);
    return handleApiError(error);
  }
}

// ============================================================================
// DELETE /api/decisions/[id] - Delete decision
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return badRequestResponse('Invalid decision ID format (must be a valid UUID)');
    }

    // Check if decision exists
    const existingDecision = await getDecisionById(id);
    if (!existingDecision) {
      return notFoundResponse('Decision', id);
    }

    // Delete decision
    await deleteDecision(id);

    return deletedResponse(id);
  } catch (error) {
    console.error('Error in DELETE /api/decisions/[id]:', error);
    return handleApiError(error);
  }
}
