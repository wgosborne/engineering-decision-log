// ============================================================================
// DECISION CARD COMPONENT
// ============================================================================
// Purpose: Display decision in list view with key information
// Used in: Decisions list page, search results
// ============================================================================

import Link from 'next/link';
import { CheckCircle2, XCircle, HelpCircle, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatTimeSince, truncateText } from '@/lib/utils/formatting';
import { Decision, CATEGORY_LABELS } from '@/lib/types/decisions';
import { getCategoryColor, getTagColor, getConfidenceColor } from '@/lib/utils/colors';

interface DecisionCardProps {
  decision: Decision;
  className?: string;
  highlightTerm?: string;
}

export function DecisionCard({ decision, className, highlightTerm }: DecisionCardProps) {
  // Determine outcome icon
  const OutcomeIcon = decision.outcome_success === true
    ? CheckCircle2
    : decision.outcome_success === false
    ? XCircle
    : HelpCircle;

  const outcomeColor = decision.outcome_success === true
    ? 'text-green-500'
    : decision.outcome_success === false
    ? 'text-red-500'
    : 'text-gray-400';

  return (
    <Link
      href={`/decisions/${decision.id}`}
      className={cn(
        'block bg-white border border-gray-200 rounded-lg p-6',
        'hover:border-[#DA70D6] hover:shadow-lg hover:shadow-[#DA70D6]/10 transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-lg font-semibold text-black flex-1">
          {highlightTerm ? (
            <span dangerouslySetInnerHTML={{ __html: highlightMatch(decision.title, highlightTerm) }} />
          ) : (
            decision.title
          )}
        </h3>

        <div className="flex items-center gap-2">
          {/* Outcome icon */}
          <OutcomeIcon className={cn('h-5 w-5', outcomeColor)} />

          {/* Category badge */}
          <Badge variant={getCategoryColor(decision.category)} size="sm">
            {CATEGORY_LABELS[decision.category]}
          </Badge>
        </div>
      </div>

      {/* Project name */}
      {decision.project_name && (
        <div className="text-sm text-gray-500 mb-3">
          Project: <span className="font-medium text-violet-600">{decision.project_name}</span>
        </div>
      )}

      {/* Preview of reasoning */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {truncateText(decision.reasoning, 150)}
      </p>

      {/* Tags */}
      {decision.tags && decision.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {decision.tags.slice(0, 5).map((tag) => (
            <Badge key={tag} variant={getTagColor(tag)} size="sm">
              {tag}
            </Badge>
          ))}
          {decision.tags.length > 5 && (
            <span className="text-xs text-gray-500 self-center">
              +{decision.tags.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Footer metadata */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatTimeSince(decision.date_created)}</span>
        </div>

        {decision.confidence_level && (
          <>
            <span>•</span>
            <div className="flex items-center gap-1">
              <TrendingUp className={cn('h-3.5 w-3.5', getConfidenceColor(decision.confidence_level))} />
              <span className={getConfidenceColor(decision.confidence_level)}>
                Confidence: {decision.confidence_level}/10
              </span>
            </div>
          </>
        )}

        {decision.flagged_for_review && (
          <>
            <span>•</span>
            <span className="text-rose-500 font-medium">Flagged for review</span>
          </>
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function highlightMatch(text: string, query: string): string {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-100">$1</mark>');
}
