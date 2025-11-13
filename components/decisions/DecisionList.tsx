'use client';

// ============================================================================
// DECISION LIST COMPONENT
// ============================================================================
// Purpose: Display decisions in a vertical list with decision cards
// Used in: Decisions list page (/decisions)
// Features: Loading states, empty states, renders DecisionCard components
// Props: decisions array, loading state, onClick handler for each card
// ============================================================================

import { Decision } from '@/lib/types/decisions';
import { DecisionCard } from './DecisionCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface DecisionListProps {
  decisions: Decision[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  className?: string;
}

export function DecisionList({
  decisions,
  isLoading,
  hasMore,
  onLoadMore,
  className,
}: DecisionListProps) {
  if (isLoading && decisions.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading decisions..." />
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No decisions found"
        description="Try adjusting your filters or create a new decision."
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {decisions.map((decision) => (
        <DecisionCard key={decision.id} decision={decision} />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            variant="secondary"
            className="min-w-[150px]"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" text="Loading..." />
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
