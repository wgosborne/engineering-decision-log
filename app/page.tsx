'use client';

// ============================================================================
// HOME PAGE - Notion-Style Decision Journal
// ============================================================================
// Purpose: Quick entry + grid view of decisions with slide-over for details
// ============================================================================

import { useEffect, useState, useMemo } from 'react';
import { Decision, DecisionCategory, DecisionType } from '@/lib/types/decisions';
import { QuickDecisionEntry } from '@/components/decisions/QuickDecisionEntry';
import { DecisionGridCard } from '@/components/decisions/DecisionGridCard';
import { DecisionForm } from '@/components/decisions/DecisionForm';
import { ProjectNotebooks } from '@/components/layout/ProjectNotebooks';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiGet } from '@/lib/api/client';
import { FileText } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils/formatting';


export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<Partial<Decision> | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const data = await apiGet<{ decisions: Decision[]; total: number }>(
          '/api/decisions?limit=50&sort=date-desc'
        );
        setDecisions(data.decisions);
      } catch (error) {
        console.error('Failed to fetch decisions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDecisions();
  }, []);

  const handleQuickEntryExpand = (data: {
    title: string;
    category: DecisionCategory;
    chosen_option: string;
    reasoning: string;
  }) => {
    setSelectedDecision({
      ...data,
      business_context: '',
      problem_statement: '',
      confidence_level: 5,
      decision_type: DecisionType.SomewhatReversible,
      optimized_for: [],
      tradeoffs_accepted: [],
      tradeoffs_rejected: [],
      project_name: '',
      tags: [],
      stakeholders: [],
      assumptions: [],
      invalidation_conditions: [],
      next_review_date: null,
      revisit_reason: null,
      flagged_for_review: false,
      notes: '',
      similar_decision_ids: [],
      related_decision_ids: [],
      similarity_notes: [],
    });
    setFormMode('create');
    setIsSheetOpen(true);
  };

  const handleCardClick = (decision: Decision) => {
    setSelectedDecision(decision);
    setFormMode('edit');
    setIsSheetOpen(true);
  };

  const handleFormSuccess = (decision: Decision) => {
    if (formMode === 'create') {
      setDecisions([decision, ...decisions]);
    } else {
      setDecisions(decisions.map((d) => (d.id === decision.id ? decision : d)));
    }
    setIsSheetOpen(false);
    setSelectedDecision(null);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedDecision(null);
  };

  const handleDelete = () => {
    if (selectedDecision?.id) {
      setDecisions(decisions.filter((d) => d.id !== selectedDecision.id));
    }
    setIsSheetOpen(false);
    setSelectedDecision(null);
  };

  // Calculate project notebooks with stats
  const projectNotebooks = useMemo(() => {
    const projectMap = new Map<string, { count: number; recentDate: string }>();

    decisions.forEach((decision) => {
      if (decision.project_name) {
        const existing = projectMap.get(decision.project_name);
        if (existing) {
          existing.count++;
          // Keep the most recent date
          if (decision.date_created > existing.recentDate) {
            existing.recentDate = decision.date_created;
          }
        } else {
          projectMap.set(decision.project_name, {
            count: 1,
            recentDate: decision.date_created,
          });
        }
      }
    });

    return Array.from(projectMap.entries())
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        color: '', // Will be assigned by the component
        recentDate: formatRelativeDate(stats.recentDate),
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [decisions]);

  // Filter decisions by selected project
  const filteredDecisions = useMemo(() => {
    if (!selectedProject) return decisions;
    return decisions.filter((d) => d.project_name === selectedProject);
  }, [decisions, selectedProject]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading decisions..." />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Decision Journal
            <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#DA70D6] to-[#FF99C8] ml-2 animate-pulse"></span>
          </h1>
          <p className="text-sm text-gray-600">
            Track your decisions and improve your decision-making over time
          </p>
        </div>

        {/* Quick Entry */}
        <div className="mb-6">
          <QuickDecisionEntry onExpand={handleQuickEntryExpand} />
        </div>

        {/* Project Notebooks */}
        {projectNotebooks.length > 0 && (
          <ProjectNotebooks
            projects={projectNotebooks}
            selectedProject={selectedProject}
            onProjectSelect={setSelectedProject}
          />
        )}

        {/* Decisions Grid */}
        {filteredDecisions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDecisions.map((decision) => (
                <DecisionGridCard
                  key={decision.id}
                  decision={decision}
                  onClick={() => handleCardClick(decision)}
                />
              ))}
          </div>
        ) : selectedProject ? (
          <EmptyState
            icon={FileText}
            title={`No decisions in ${selectedProject}`}
            description="This project doesn't have any decisions yet"
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="No decisions yet"
            description="Start by adding your first decision using the quick entry above"
          />
        )}
      </div>

      {/* Slide-over Sheet with Full Form */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        title={formMode === 'create' ? 'New Decision' : 'Edit Decision'}
      >
        {selectedDecision && (
          <DecisionForm
            decision={selectedDecision as Decision}
            mode={formMode}
            onSuccess={handleFormSuccess}
            onCancel={handleSheetClose}
            onDelete={formMode === 'edit' ? handleDelete : undefined}
            className="max-w-none"
          />
        )}
      </Sheet>
    </>
  );
}
