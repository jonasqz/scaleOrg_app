'use client';

import { useState } from 'react';
import { BarChart3, Scale, Users, Lightbulb, TrendingDown } from 'lucide-react';
import AnalyticsGeneralTab from './analytics-general-tab';
import AnalyticsBenchmarkingTab from './analytics-benchmarking-tab';
import AnalyticsTenureTab from './analytics-tenure-tab';
import AnalyticsRecommendationsTab from './analytics-recommendations-tab';
import AnalyticsPayGapTab from './analytics-pay-gap-tab';

interface AnalyticsTabsProps {
  datasetId: string;
  currency: string;
  employees: any[];
  metrics: any;
  dataset: any;
  departmentCategories?: Record<string, string>;
}

type AnalyticsTabId = 'general' | 'benchmarking' | 'tenure' | 'pay-gap' | 'recommendations';

export default function AnalyticsTabs({
  datasetId,
  currency,
  employees,
  metrics,
  dataset,
  departmentCategories,
}: AnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('general');

  const tabs = [
    { id: 'general' as AnalyticsTabId, label: 'General Overview', icon: BarChart3 },
    { id: 'benchmarking' as AnalyticsTabId, label: 'Bands', icon: Scale },
    { id: 'tenure' as AnalyticsTabId, label: 'Team & Span of Control', icon: Users },
    { id: 'pay-gap' as AnalyticsTabId, label: 'Pay Gap Analysis', icon: TrendingDown },
    { id: 'recommendations' as AnalyticsTabId, label: 'Recommendations', icon: Lightbulb },
  ];

  if (!metrics || employees.length < 3) {
    return (
      <div className="rounded-lg border-2 border-dashed border-yellow-200 bg-yellow-50 p-6 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-yellow-600" />
        <p className="mt-3 text-sm font-medium text-yellow-900">
          Need more data for analytics
        </p>
        <p className="mt-1 text-xs text-yellow-700">
          Add at least 3 employees to see analytics and insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation */}
      <div className="border-b border-stone-200">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && (
          <AnalyticsGeneralTab
            datasetId={datasetId}
            currency={currency}
            employees={employees}
            metrics={metrics}
            dataset={dataset}
            departmentCategories={departmentCategories}
          />
        )}

        {activeTab === 'benchmarking' && (
          <AnalyticsBenchmarkingTab
            datasetId={datasetId}
            currency={currency}
            employees={employees}
            metrics={metrics}
            dataset={dataset}
          />
        )}

        {activeTab === 'tenure' && (
          <AnalyticsTenureTab
            datasetId={datasetId}
            currency={currency}
            employees={employees}
            metrics={metrics}
            dataset={dataset}
          />
        )}

        {activeTab === 'pay-gap' && (
          <AnalyticsPayGapTab
            datasetId={datasetId}
            currency={currency}
            employees={employees}
            metrics={metrics}
            dataset={dataset}
          />
        )}

        {activeTab === 'recommendations' && (
          <AnalyticsRecommendationsTab
            datasetId={datasetId}
            currency={currency}
            employees={employees}
            metrics={metrics}
            dataset={dataset}
          />
        )}
      </div>
    </div>
  );
}
