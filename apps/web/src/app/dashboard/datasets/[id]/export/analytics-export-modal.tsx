'use client';

import React, { useState, useRef } from 'react';
import { X, Download, Eye, Loader2 } from 'lucide-react';
import { AnalyticsSlideDeck } from './analytics-slide-deck';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface AnalyticsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: any;
  employees: any[];
  metrics: any;
  benchmarkSummary?: {
    totalEmployees: number;
    benchmarkedEmployees: number;
    averageMarketPosition: number;
  };
}

export function AnalyticsExportModal({
  isOpen,
  onClose,
  dataset,
  employees,
  metrics,
  benchmarkSummary: propBenchmarkSummary,
}: AnalyticsExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'preview' | 'export'>('preview');
  const [benchmarkSummary, setBenchmarkSummary] = useState(propBenchmarkSummary);
  const [isLoadingBenchmarks, setIsLoadingBenchmarks] = useState(false);
  const slideDeckRef = useRef<HTMLDivElement>(null);

  // Fetch benchmark summary when modal opens
  React.useEffect(() => {
    if (isOpen && !benchmarkSummary) {
      setIsLoadingBenchmarks(true);
      fetch(`/api/datasets/${dataset.id}/employee-benchmarks`)
        .then((res) => res.json())
        .then((data) => {
          setBenchmarkSummary(data.summary);
        })
        .catch((err) => {
          console.error('Failed to fetch benchmark summary:', err);
        })
        .finally(() => {
          setIsLoadingBenchmarks(false);
        });
    }
  }, [isOpen, dataset.id, benchmarkSummary]);

  if (!isOpen) return null;

  const handleExportPDF = async () => {
    if (!slideDeckRef.current) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      const slides = slideDeckRef.current.querySelectorAll('.print\\:break-after-page');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1024, 768],
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        setExportProgress(Math.round(((i + 1) / slides.length) * 100));

        // Capture the slide as canvas
        const canvas = await html2canvas(slide, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');

        if (i > 0) {
          pdf.addPage();
        }

        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, 1024, 768);
      }

      // Generate filename
      const filename = `Workforce_Analytics_${dataset.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Save PDF
      pdf.save(filename);

      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setIsExporting(false);
      alert('Failed to export PDF. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex h-[90vh] w-full max-w-7xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analytics Report Export
            </h2>
            <p className="text-sm text-gray-500">
              Preview and export your workforce analytics as a professional slide deck
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'preview' ? 'export' : 'preview')}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              {viewMode === 'preview' ? 'Switch to Export' : 'Switch to Preview'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting... {exportProgress}%
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export as PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
          <div className="mx-auto space-y-8" ref={slideDeckRef}>
            <AnalyticsSlideDeck
              dataset={dataset}
              employees={employees}
              metrics={metrics}
              benchmarkSummary={benchmarkSummary}
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              Report generated on {new Date().toLocaleDateString()} • {employees.length} employees analyzed
            </div>
            <div className="flex items-center gap-4">
              <div>Slide format: 1024×768 px</div>
              <div>•</div>
              <div>Professional consulting style</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
