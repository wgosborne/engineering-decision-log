'use client';

// ============================================================================
// DECISION GRID CARD COMPONENT
// ============================================================================
// Purpose: Compact card for displaying decision summary in grid layouts
// Used in: Home page decision grid, decisions list page
// Features: Shows title, category, project, confidence, timestamp, tags
// Interaction: Clickable to view full decision details
// ============================================================================

import { Decision, CATEGORY_LABELS } from '@/lib/types/decisions';
import { Badge } from '@/components/ui/Badge';
import { formatTimeSince } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils/cn';
import { getCategoryColor, getTagColor, getConfidenceColor } from '@/lib/utils/colors';

interface DecisionGridCardProps {
  decision: Decision;
  onClick: () => void;
  className?: string;
}

export function DecisionGridCard({ decision, onClick, className }: DecisionGridCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-4 cursor-pointer',
        'hover:border-[#8B5CF6] hover:shadow-lg hover:shadow-[#8B5CF6]/10 hover:-translate-y-0.5 transition-all duration-200',
        'space-y-3',
        className
      )}
    >
      {/* Title */}
      <h3 className="text-sm font-semibold text-black line-clamp-2 min-h-[40px]">
        {decision.title}
      </h3>

      {/* Category Badge */}
      <div>
        <Badge variant={getCategoryColor(decision.category)} size="sm">
          {CATEGORY_LABELS[decision.category]}
        </Badge>
      </div>

      {/* Tags */}
      {decision.tags && decision.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {decision.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant={getTagColor(tag)} size="sm">
              {tag}
            </Badge>
          ))}
          {decision.tags.length > 3 && (
            <span className="text-xs text-gray-500 self-center">
              +{decision.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Chosen Option */}
      {decision.chosen_option && (
        <p className="text-xs text-gray-700 line-clamp-2">
          <span className="font-medium">Chose:</span> {decision.chosen_option}
        </p>
      )}

      {/* Reasoning - brief preview */}
      {decision.reasoning && (
        <p className="text-xs text-gray-500 line-clamp-2">{decision.reasoning}</p>
      )}

      {/* Footer - Date and Confidence */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
        <span className="text-gray-400">{formatTimeSince(decision.date_created)}</span>
        {decision.confidence_level && (
          <span className={cn('font-medium', getConfidenceColor(decision.confidence_level))}>
            {decision.confidence_level}/10
          </span>
        )}
      </div>
    </div>
  );
}
