'use client';

import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { EnhancedExportModal } from './export/enhanced-export-modal';

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
      <div className="flex items-start justify-between pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">Analytics & Insights</h1>
          <p className="mt-1 text-xs text-stone-500">
            Deep dive into your workforce metrics and trends
          </p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 text-xs font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
        >
          <FileDown className="h-3.5 w-3.5" />
          Export Report
        </button>
      </div>

      <EnhancedExportModal
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
