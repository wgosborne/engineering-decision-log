'use client';

// ============================================================================
// NEW DECISION PAGE
// ============================================================================
// Purpose: Page for creating a new decision entry
// Route: /decisions/new
// Features: Full decision form with all fields, back navigation, success redirect
// ============================================================================

import { DecisionForm } from '@/components/decisions/DecisionForm';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewDecisionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/decisions">
          <Button variant="ghost" className="flex items-center gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Decisions
          </Button>
        </Link>

        <DecisionForm mode="create" onCancel={() => router.push('/decisions')} />
      </div>
    </div>
  );
}
