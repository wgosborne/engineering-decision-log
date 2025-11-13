'use client';

// ============================================================================
// ANALYTICS PAGE
// ============================================================================
// Purpose: Dashboard displaying decision-making analytics and insights
// Route: /analytics
// Features: Period filtering, success rates, category breakdowns, optimization patterns
// Data: Pulled from /api/decisions/analytics/summary endpoint
// ============================================================================

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CATEGORY_LABELS } from '@/lib/types/decisions';
import {
  BarChart3,
  TrendingUp,
  Award,
  Target,
  Flag,
  AlertCircle,
  PieChart,
  Activity
} from 'lucide-react';

interface AnalyticsSummary {
  total_decisions: number;
  decisions_by_category: Record<string, number>;
  success_rate_by_category: Record<string, number>;
  optimized_for_frequency: Record<string, number>;
  tradeoffs_accepted_frequency: Record<string, number>;
  tradeoffs_rejected_frequency: Record<string, number>;
  average_confidence: number;
  decisions_with_outcomes: number;
  overall_success_rate: number;
  flagged_for_review_count: number;
  decisions_past_review_date: number;
}

type Period = 'week' | 'month' | 'quarter' | 'all';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiGet<AnalyticsSummary>(
          `/api/decisions/analytics/summary?period=${period}`
        );
        setAnalytics(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [period]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Sort functions for displaying data
  const sortedCategories = Object.entries(analytics.decisions_by_category).sort(
    ([, a], [, b]) => b - a
  );

  const sortedOptimizedFor = Object.entries(analytics.optimized_for_frequency).sort(
    ([, a], [, b]) => b - a
  );

  const sortedTradeoffsAccepted = Object.entries(analytics.tradeoffs_accepted_frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const sortedSuccessRates = Object.entries(analytics.success_rate_by_category).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Analytics</h1>
          <p className="text-sm text-gray-600">
            Insights and patterns from your decision-making process
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-8 flex gap-2">
          {(['week', 'month', 'quarter', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === 'all' ? 'All Time' : `Last ${p}`}
            </button>
          ))}
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={BarChart3}
            label="Total Decisions"
            value={analytics.total_decisions.toString()}
            color="blue"
          />
          <MetricCard
            icon={Target}
            label="Average Confidence"
            value={analytics.average_confidence.toFixed(1)}
            subtitle="out of 10"
            color="purple"
          />
          <MetricCard
            icon={TrendingUp}
            label="Success Rate"
            value={`${analytics.overall_success_rate}%`}
            subtitle={`${analytics.decisions_with_outcomes} with outcomes`}
            color="green"
          />
          <MetricCard
            icon={Flag}
            label="Flagged for Review"
            value={analytics.flagged_for_review_count.toString()}
            subtitle={`${analytics.decisions_past_review_date} past due`}
            color="red"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Decisions by Category */}
          <AnalyticsCard title="Decisions by Category" icon={PieChart}>
            {sortedCategories.length > 0 ? (
              <div className="space-y-3">
                {sortedCategories.map(([category, count]) => (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                      </span>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full"
                        style={{
                          width: `${(count / analytics.total_decisions) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </AnalyticsCard>

          {/* Success Rate by Category */}
          <AnalyticsCard title="Success Rate by Category" icon={Award}>
            {sortedSuccessRates.length > 0 ? (
              <div className="space-y-3">
                {sortedSuccessRates.map(([category, rate]) => (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                      </span>
                      <span className="text-sm text-gray-600">{rate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          rate >= 70 ? 'bg-green-500' : rate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No outcome data available</p>
            )}
          </AnalyticsCard>

          {/* Optimization Priorities */}
          <AnalyticsCard title="What You Optimize For" icon={Target}>
            {sortedOptimizedFor.length > 0 ? (
              <div className="space-y-3">
                {sortedOptimizedFor.map(([factor, count]) => (
                  <div key={factor}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {factor}
                      </span>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(count / analytics.total_decisions) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No optimization data available</p>
            )}
          </AnalyticsCard>

          {/* Top Tradeoffs Accepted */}
          <AnalyticsCard title="Common Tradeoffs Accepted" icon={Activity}>
            {sortedTradeoffsAccepted.length > 0 ? (
              <div className="space-y-2">
                {sortedTradeoffsAccepted.map(([tradeoff, count]) => (
                  <div
                    key={tradeoff}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-700">{tradeoff}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No tradeoff data available</p>
            )}
          </AnalyticsCard>
        </div>

        {/* Insights Section */}
        {analytics.decisions_past_review_date > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                  Decisions Need Review
                </h3>
                <p className="text-sm text-yellow-800">
                  You have {analytics.decisions_past_review_date} decision
                  {analytics.decisions_past_review_date !== 1 ? 's' : ''} past their review date.
                  Consider revisiting them to assess outcomes and learnings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  subtitle?: string;
  color: 'blue' | 'purple' | 'green' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-black mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

// Analytics Card Component
function AnalyticsCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}
