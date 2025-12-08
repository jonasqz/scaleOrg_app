'use client';

import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { AnalyticsExportModal } from './export/analytics-export-modal';

interface AnalyticsHeaderProps {
  dataset: any;
  employees: any[];
  metrics: any;
  benchmarkSummary?: {
    totalEmployees: number;
    benchmarkedEmployees: number;
    averageMarketPosition: number;
  };
}

export function AnalyticsHeader({
  dataset,
  employees,
  metrics,
  benchmarkSummary,
}: AnalyticsHeaderProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="mt-2 text-gray-600">
            Deep dive into your workforce metrics and trends
          </p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0891b2] to-[#2563eb] px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
        >
          <FileDown className="h-4 w-4" />
          Export Report
        </button>
      </div>

      <AnalyticsExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        dataset={dataset}
        employees={employees}
        metrics={metrics}
        benchmarkSummary={benchmarkSummary}
      />
    </>
  );
}
