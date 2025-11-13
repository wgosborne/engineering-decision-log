"use client";

// ============================================================================
// DECISION DETAIL PAGE
// ============================================================================
// Purpose: Display full details of a single decision
// Route: /decisions/[id]
// Features: View decision details, delete decision, flag for review, add outcomes
// ============================================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DecisionDetail } from "@/components/decisions/DecisionDetail";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { apiGet, apiDelete, apiPut } from "@/lib/api/client";
import { Decision } from "@/lib/types/decisions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DecisionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [decision, setDecision] = useState<Decision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDecision() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiGet<Decision>(`/api/decisions/${id}`);
        setDecision(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch decision");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchDecision();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!decision) return;

    const confirmed = confirm(
      "Are you sure you want to delete this decision? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await apiDelete(`/api/decisions/${decision.id}`);
      router.push("/decisions");
    } catch (err: any) {
      alert(`Failed to delete decision: ${err.message}`);
    }
  };

  const handleFlag = async () => {
    if (!decision) return;

    try {
      const updated = await apiPut<Decision>(
        `/api/decisions/${decision.id}/flag-for-review`,
        {
          flagged: !decision.flagged_for_review,
        }
      );
      setDecision(updated);
    } catch (err: any) {
      alert(`Failed to flag decision: ${err.message}`);
    }
  };

  const handleAddOutcome = () => {
    // Navigate to edit page with a hash to scroll to outcome section
    router.push(`/decisions/${id}/edit#outcome`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading decision..." />
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/decisions">
            <Button variant="ghost" className="flex items-center gap-2 mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Decisions
            </Button>
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error || "Decision not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/decisions">
          <Button variant="ghost" className="flex items-center gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Decisions
          </Button>
        </Link>

        <DecisionDetail
          decision={decision}
          onDelete={handleDelete}
          onFlag={handleFlag}
          onAddOutcome={handleAddOutcome}
        />
      </div>
    </div>
  );
}
