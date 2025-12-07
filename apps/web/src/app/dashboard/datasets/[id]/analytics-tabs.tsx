'use client';

import { useState } from 'react';
import { BarChart3, Scale, Users, Lightbulb, DollarSign } from 'lucide-react';
import AnalyticsGeneralTab from './analytics-general-tab';
import AnalyticsBenchmarkingTab from './analytics-benchmarking-tab';
import AnalyticsTenureTab from './analytics-tenure-tab';
import AnalyticsRecommendationsTab from './analytics-recommendations-tab';
import AnalyticsCostsTab from './analytics-costs-tab';

interface AnalyticsTabsProps {
  datasetId: string;
  currency: string;
  employees: any[];
  metrics: any;
  dataset: any;
  departmentCategories?: Record<string, string>;
}

type AnalyticsTabId = 'general' | 'benchmarking' | 'tenure' | 'costs' | 'recommendations';

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
    { id: 'benchmarking' as AnalyticsTabId, label: 'Benchmarking', icon: Scale },
    { id: 'tenure' as AnalyticsTabId, label: 'Team & Span of Control', icon: Users },
    { id: 'costs' as AnalyticsTabId, label: 'Employer Costs', icon: DollarSign },
    { id: 'recommendations' as AnalyticsTabId, label: 'Recommendations', icon: Lightbulb },
  ];

  if (!metrics || employees.length < 3) {
    return (
      <div className="rounded-lg border bg-yellow-50 p-8 text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-yellow-600" />
        <p className="mt-4 font-medium text-yellow-900">
          Need more data for analytics
        </p>
        <p className="mt-1 text-sm text-yellow-700">
          Add at least 3 employees to see analytics and insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
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

        {activeTab === 'costs' && (
          <AnalyticsCostsTab
            datasetId={datasetId}
            currency={currency}
            employees={employees}
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
