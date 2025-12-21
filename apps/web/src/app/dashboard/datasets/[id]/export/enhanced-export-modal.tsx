'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Download, Loader2, ArrowLeft } from 'lucide-react';
import { ExportConfigModal } from './export-config-modal';
import { AnalyticsSlideDeck } from './analytics-slide-deck';
import {
  ExportConfiguration,
  getDefaultExportConfig,
  getEnabledSections,
} from '@/lib/export-types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  PayGapSlide,
  TenureSlide,
  CashFlowSlide,
  EmployeeDetailsSlide,
  KPIsSlide,
} from './slides';
import { calculateAllMetrics } from '@scleorg/calculations';

interface EnhancedExportModalProps {
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

type ModalStep = 'config' | 'preview';

export function EnhancedExportModal({
  isOpen,
  onClose,
  dataset,
  employees,
  metrics,
  benchmarkSummary: propBenchmarkSummary,
}: EnhancedExportModalProps) {
  const [step, setStep] = useState<ModalStep>('config');
  const [config, setConfig] = useState<ExportConfiguration | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [benchmarkSummary, setBenchmarkSummary] = useState(propBenchmarkSummary);
  const [isLoadingBenchmarks, setIsLoadingBenchmarks] = useState(false);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [isLoadingCashFlow, setIsLoadingCashFlow] = useState(false);
  const slideDeckRef = useRef<HTMLDivElement>(null);

  // Fetch benchmark summary when modal opens
  useEffect(() => {
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

  // Fetch cash flow data when cash flow slide is selected
  useEffect(() => {
    if (isOpen && config && !cashFlowData) {
      const hasCashFlowSlide = config.sections.some(
        (s) => s.id === 'cash_flow_runway' && s.enabled
      );

      if (hasCashFlowSlide && dataset.currentCashBalance) {
        setIsLoadingCashFlow(true);
        fetch(`/api/datasets/${dataset.id}/cash-flow`)
          .then((res) => res.json())
          .then((data) => {
            setCashFlowData(data);
          })
          .catch((err) => {
            console.error('Failed to fetch cash flow data:', err);
          })
          .finally(() => {
            setIsLoadingCashFlow(false);
          });
      }
    }
  }, [isOpen, config, dataset.id, dataset.currentCashBalance, cashFlowData]);

  // Calculate metrics if not provided
  const calculatedMetrics = useMemo(() => {
    console.log('EnhancedExportModal - Data check:', {
      hasMetrics: !!metrics,
      employeeCount: employees.length,
      datasetId: dataset.id,
      datasetName: dataset.name,
    });

    if (metrics) {
      console.log('Using provided metrics');
      return metrics;
    }

    if (employees.length === 0) {
      console.warn('No employees found for metrics calculation');
      return null;
    }

    try {
      console.log('Calculating metrics from employees...');
      const calculated = calculateAllMetrics(employees, dataset);
      console.log('Metrics calculated successfully:', {
        hasDepartments: !!calculated?.departments,
        departmentCount: calculated?.departments ? Object.keys(calculated.departments).length : 0,
      });
      return calculated;
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return null;
    }
  }, [employees, dataset, metrics]);

  if (!isOpen) return null;

  const handleConfigComplete = (exportConfig: ExportConfiguration) => {
    setConfig(exportConfig);
    setStep('preview');
  };

  const handleBackToConfig = () => {
    setStep('config');
  };

  const handleExportPDF = async () => {
    if (!slideDeckRef.current || !config) return;

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

      // Generate filename with confidentiality level
      const confidentialityPrefix =
        config.settings.confidentialityLevel === 'highly_confidential'
          ? 'HIGHLY_CONFIDENTIAL_'
          : config.settings.confidentialityLevel === 'confidential'
          ? 'CONFIDENTIAL_'
          : config.settings.confidentialityLevel === 'internal'
          ? 'INTERNAL_'
          : '';

      const filename = `${confidentialityPrefix}${config.settings.title
        .replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Save PDF
      pdf.save(filename);

      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
        // Reset state
        setStep('config');
        setConfig(null);
      }, 500);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setIsExporting(false);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportExcel = async () => {
    if (!config) return;

    // TODO: Implement Excel export with ExcelJS
    alert('Excel export coming soon! This will create a multi-sheet workbook with all data.');
  };

  // Show configuration modal
  if (step === 'config') {
    return (
      <ExportConfigModal
        isOpen={isOpen}
        onClose={onClose}
        onExport={handleConfigComplete}
        datasetName={dataset.name}
      />
    );
  }

  // Show preview with export button
  const enabledSections = config ? getEnabledSections(config) : [];
  const isLoading = isLoadingBenchmarks || isLoadingCashFlow;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex h-[90vh] w-full max-w-7xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToConfig}
              disabled={isExporting}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Settings
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Export Preview</h2>
              <p className="text-sm text-gray-500">
                {enabledSections.length} sections • {config?.format === 'pdf' ? 'PDF' : 'Excel'}{' '}
                format
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {config?.format === 'pdf' ? (
              <button
                onClick={handleExportPDF}
                disabled={isExporting || isLoading}
                className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting... {exportProgress}%
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading data...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export as PDF
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleExportExcel}
                disabled={isExporting || isLoading}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading data...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export as Excel
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isExporting}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content - Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
                <p className="mt-4 text-sm text-gray-600">Loading export data...</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto space-y-8" ref={slideDeckRef}>
              {/* Debug logging */}
              {console.log('Rendering slides with config:', {
                hasConfig: !!config,
                enabledSections: config?.sections.filter(s => s.enabled).map(s => s.id) || [],
                hasEmployees: employees.length > 0,
                hasMetrics: !!calculatedMetrics,
              })}

              {/* Existing slides from original slide deck */}
              <AnalyticsSlideDeck
                dataset={dataset}
                employees={employees}
                metrics={calculatedMetrics}
                benchmarkSummary={benchmarkSummary}
                config={config}
              />

              {/* New slides based on configuration */}
              {config?.sections.find((s) => s.id === 'pay_gap_analysis' && s.enabled) && (
                <PayGapSlide
                  employees={employees}
                  currency={dataset.currency || 'EUR'}
                  branding={config.branding}
                />
              )}

              {config?.sections.find((s) => s.id === 'tenure_retention' && s.enabled) && (
                <TenureSlide
                  employees={employees}
                  metrics={calculatedMetrics}
                  branding={config.branding}
                />
              )}

              {config?.sections.find((s) => s.id === 'cash_flow_runway' && s.enabled) &&
                cashFlowData && (
                  <CashFlowSlide
                    dataset={dataset}
                    currency={dataset.currency || 'EUR'}
                    cashFlowData={cashFlowData}
                    branding={config.branding}
                  />
                )}

              {config?.sections.find((s) => s.id === 'employee_details' && s.enabled) && (
                <EmployeeDetailsSlide
                  employees={employees}
                  currency={dataset.currency || 'EUR'}
                  branding={config.branding}
                  includeCompensation={config.settings.confidentialityLevel !== 'public'}
                />
              )}

              {config?.sections.find((s) => s.id === 'kpis_dashboard' && s.enabled) && (
                <KPIsSlide
                  metrics={calculatedMetrics}
                  employees={employees}
                  dataset={dataset}
                  currency={dataset.currency || 'EUR'}
                  branding={config.branding}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              Report: {config?.settings.title} • {new Date().toLocaleDateString()} •{' '}
              {employees.length} employees
            </div>
            <div className="flex items-center gap-4">
              <div>
                Confidentiality:{' '}
                {config?.settings.confidentialityLevel
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
              {config?.branding.companyName && (
                <>
                  <div>•</div>
                  <div>{config.branding.companyName}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
