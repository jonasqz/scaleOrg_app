'use client';

import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { EnhancedExportModal } from './export/enhanced-export-modal';
import { usePathname } from 'next/navigation';

interface DatasetExportProviderProps {
  datasetId: string;
  dataset: any;
  employees: any[];
}

export function DatasetExportProvider({
  datasetId,
  dataset,
  employees,
}: DatasetExportProviderProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const pathname = usePathname();

  // Only show export button on analytics pages
  const isAnalyticsPage = pathname?.includes('/analytics');

  const handleExportClick = () => {
    // Data is already available from props (fetched in layout)
    setIsExportModalOpen(true);
  };

  if (!isAnalyticsPage) {
    return null; // Don't show export button outside analytics section
  }

  return (
    <>
      {/* Floating Export Button */}
      <button
        onClick={handleExportClick}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 text-sm font-medium text-white shadow-lg hover:from-orange-600 hover:to-orange-700 hover:shadow-xl transition-all"
        title="Export Analytics Report"
      >
        <FileDown className="h-4 w-4" />
        <span className="hidden sm:inline">Export Report</span>
      </button>

      {/* Export Modal */}
      <EnhancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        dataset={dataset}
        employees={employees}
        metrics={null}
        benchmarkSummary={undefined}
      />
    </>
  );
}
