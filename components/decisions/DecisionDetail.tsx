'use client';

import { Decision, CATEGORY_LABELS, OPTIMIZED_FOR_LABELS } from '@/lib/types/decisions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatRelativeDate } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils/cn';
import { getCategoryColor, getTagColor } from '@/lib/utils/colors';
import {
  Edit,
  Trash2,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
  Tag,
  TrendingUp,
  Scale,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

interface DecisionDetailProps {
  decision: Decision;
  onDelete?: () => void;
  onFlag?: () => void;
  onAddOutcome?: () => void;
  className?: string;
}

export function DecisionDetail({
  decision,
  onDelete,
  onFlag,
  onAddOutcome,
  className,
}: DecisionDetailProps) {
  const OutcomeIcon = decision.outcome_success
    ? CheckCircle2
    : decision.outcome_success === false
    ? XCircle
    : Clock;

  const outcomeColor = decision.outcome_success
    ? 'text-green-600'
    : decision.outcome_success === false
    ? 'text-red-600'
    : 'text-gray-400';

  return (
    <div className={cn('max-w-6xl mx-auto', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl font-bold">{decision.title}</h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/decisions/${decision.id}/edit`}>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                {onFlag && (
                  <Button
                    variant={decision.flagged_for_review ? 'primary' : 'ghost'}
                    onClick={onFlag}
                    className="flex items-center gap-2"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="danger"
                    onClick={onDelete}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <Badge variant={getCategoryColor(decision.category)}>{CATEGORY_LABELS[decision.category]}</Badge>
              {decision.project_name && (
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-violet-600">{decision.project_name}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(decision.date_created)}
              </span>
              {decision.confidence_level && (
                <span className="font-medium">
                  Confidence: {decision.confidence_level}/10
                </span>
              )}
            </div>

            {/* Tags */}
            {decision.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {decision.tags.map((tag) => (
                  <Badge key={tag} variant={getTagColor(tag)} size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Context Section */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Context
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Business Context</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {decision.business_context}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Problem Statement</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {decision.problem_statement}
                </p>
              </div>
            </div>
          </section>

          {/* Decision Section */}
          <section>
            <h2 className="text-xl font-semibold mb-3">Decision</h2>
            <div className="space-y-4">
              {decision.chosen_option && (
                <div className="bg-[#FFF5F8] border border-[#F5B5C5] rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-1">Chosen Option</h3>
                  <p className="text-gray-800">{decision.chosen_option}</p>
                </div>
              )}
              {decision.reasoning && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Reasoning</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{decision.reasoning}</p>
                </div>
              )}
            </div>
          </section>

          {/* Options Considered */}
          {decision.options_considered.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3">Options Considered</h2>
              <div className="space-y-4">
                {decision.options_considered.map((option, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{option.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-1">Pros</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {option.pros.map((pro, i) => (
                            <li key={i}>• {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-700 mb-1">Cons</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {option.cons.map((con, i) => (
                            <li key={i}>• {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tradeoffs */}
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Tradeoffs
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {decision.tradeoffs_accepted.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Accepted</h3>
                  <ul className="space-y-2">
                    {decision.tradeoffs_accepted.map((tradeoff, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">▼</span>
                        {tradeoff}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {decision.tradeoffs_rejected.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Rejected</h3>
                  <ul className="space-y-2">
                    {decision.tradeoffs_rejected.map((tradeoff, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">✕</span>
                        {tradeoff}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Outcome */}
          {decision.outcome ? (
            <section className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <OutcomeIcon className={cn('h-5 w-5', outcomeColor)} />
                Outcome
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        decision.outcome_success
                          ? 'success'
                          : decision.outcome_success === false
                          ? 'danger'
                          : 'default'
                      }
                    >
                      {decision.outcome_success
                        ? 'Success'
                        : decision.outcome_success === false
                        ? 'Failed'
                        : 'Pending'}
                    </Badge>
                    {decision.outcome_date && (
                      <span className="text-sm text-gray-500">
                        {formatDate(decision.outcome_date)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{decision.outcome}</p>
                </div>
                {decision.lessons_learned && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Lessons Learned</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {decision.lessons_learned}
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            onAddOutcome && (
              <section className="border-t border-gray-200 pt-8">
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">No outcome yet</h3>
                  <p className="text-gray-600 mb-4">
                    Add an outcome once this decision has played out.
                  </p>
                  <Button onClick={onAddOutcome} variant="primary">
                    Add Outcome
                  </Button>
                </div>
              </section>
            )
          )}

          {/* Notes */}
          {decision.notes && (
            <section className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold mb-3">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{decision.notes}</p>
            </section>
          )}
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-sm uppercase text-gray-500">Details</h3>

            {decision.stakeholders.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Stakeholders
                </h4>
                <div className="flex flex-wrap gap-1">
                  {decision.stakeholders.map((stakeholder, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {stakeholder}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {decision.optimized_for.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Optimized For
                </h4>
                <div className="flex flex-wrap gap-1">
                  {decision.optimized_for.map((opt) => (
                    <Badge key={opt} variant="accent" className="text-xs">
                      {OPTIMIZED_FOR_LABELS[opt]}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {decision.decision_type && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Reversibility</h4>
                <p className="text-sm text-gray-600 capitalize">
                  {decision.decision_type.replace('-', ' ')}
                </p>
              </div>
            )}

            {decision.next_review_date && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Next Review
                </h4>
                <p className="text-sm text-gray-600">
                  {formatDate(decision.next_review_date)}
                  <span className="text-xs text-gray-500 block">
                    ({formatRelativeDate(decision.next_review_date)})
                  </span>
                </p>
              </div>
            )}

            {decision.flagged_for_review && (
              <div className="bg-orange-50 border border-orange-200 rounded p-2">
                <p className="text-xs font-medium text-orange-800 flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  Flagged for review
                </p>
                {decision.revisit_reason && (
                  <p className="text-xs text-orange-700 mt-1">{decision.revisit_reason}</p>
                )}
              </div>
            )}
          </div>

          {/* Assumptions */}
          {decision.assumptions.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm uppercase text-gray-500 mb-3">
                Assumptions
              </h3>
              <ul className="space-y-2">
                {decision.assumptions.map((assumption, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    {assumption}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Invalidation Conditions */}
          {decision.invalidation_conditions.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm uppercase text-gray-500 mb-3">
                When to Revisit
              </h3>
              <ul className="space-y-2">
                {decision.invalidation_conditions.map((condition, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">⚠</span>
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timestamps */}
          <div className="border border-gray-200 rounded-lg p-4 text-xs text-gray-500 space-y-1">
            <div>Created: {formatDate(decision.date_created)}</div>
            <div>Updated: {formatDate(decision.date_updated)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
