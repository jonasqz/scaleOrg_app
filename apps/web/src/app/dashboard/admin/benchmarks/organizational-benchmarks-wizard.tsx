'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import {
  calculateMetricsFromHeadcount,
  validateDepartmentHeadcount,
  validatePercentileOrdering,
  calculateTotalHeadcount,
  type DepartmentHeadcount,
  type PercentileHeadcount,
} from '@scleorg/calculations';

interface Props {
  sources: any[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

type Step = 1 | 2 | 3 | 4;

interface WizardData {
  // Step 1: Choose mode
  entryMode: 'DETAILED' | 'FALLBACK';

  // Step 2: Context
  industry: string;
  region: string;
  companySize: string;
  growthStage: string;
  effectiveDate: string;
  sourceId: string;
  sampleSize: string;
  notes: string;

  // Step 3A: Detailed mode - Department headcount
  departmentHeadcount: Partial<PercentileHeadcount>;

  // Step 3B: Fallback mode - Direct metrics
  benchmarkType: 'STRUCTURE' | 'EFFICIENCY' | 'TENURE';
  metricName: string;
  p10Value: string;
  p25Value: string;
  p50Value: string;
  p75Value: string;
  p90Value: string;
  unit: string;
  currency: string;

  // Optional: Revenue data for efficiency calculations
  hasRevenueData: boolean;
  revenueData: {
    p10?: string;
    p25?: string;
    p50?: string;
    p75?: string;
    p90?: string;
  };
}

export default function OrganizationalBenchmarksWizard({ sources, onSave, onCancel }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<WizardData>({
    entryMode: 'DETAILED',
    industry: '',
    region: '',
    companySize: '',
    growthStage: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    sourceId: '',
    sampleSize: '',
    notes: '',
    departmentHeadcount: {
      p50: { rd: 0, gtm: 0, ga: 0, operations: 0, other: 0, total: 0 },
    },
    benchmarkType: 'STRUCTURE',
    metricName: '',
    p10Value: '',
    p25Value: '',
    p50Value: '',
    p75Value: '',
    p90Value: '',
    unit: '',
    currency: '',
    hasRevenueData: false,
    revenueData: {},
  });

  // Validation for each step
  const validateStep = (step: Step): string[] => {
    const errors: string[] = [];

    if (step === 1) {
      // No validation needed for mode selection
    }

    if (step === 2) {
      if (!data.industry) errors.push('Industry is required');
      if (!data.region) errors.push('Region is required');
      if (!data.companySize) errors.push('Company Size is required');
      if (!data.effectiveDate) errors.push('Effective Date is required');
      if (!data.sampleSize || Number(data.sampleSize) < 1) {
        errors.push('Sample Size must be at least 1');
      }
    }

    if (step === 3 && data.entryMode === 'DETAILED') {
      // Validate p50 is always provided
      if (!data.departmentHeadcount.p50) {
        errors.push('Median (P50) department breakdown is required');
      } else {
        const validationErrors = validateDepartmentHeadcount(data.departmentHeadcount.p50);
        errors.push(...validationErrors);
      }

      // Validate percentile ordering for total headcount
      const percentiles = ['p10', 'p25', 'p50', 'p75', 'p90'] as const;
      const totals: Record<string, number | undefined> = {};
      percentiles.forEach((p) => {
        const hc = data.departmentHeadcount[p];
        if (hc) totals[p] = hc.total;
      });
      const orderingErrors = validatePercentileOrdering(totals, 'Total Headcount');
      errors.push(...orderingErrors);
    }

    if (step === 3 && data.entryMode === 'FALLBACK') {
      if (!data.benchmarkType) errors.push('Benchmark Type is required');
      if (!data.metricName) errors.push('Metric Name is required');
      if (!data.p50Value) errors.push('P50 (median) value is required');

      // Validate percentile ordering
      const percentileValues: Record<string, number | undefined> = {
        p10: data.p10Value ? Number(data.p10Value) : undefined,
        p25: data.p25Value ? Number(data.p25Value) : undefined,
        p50: Number(data.p50Value),
        p75: data.p75Value ? Number(data.p75Value) : undefined,
        p90: data.p90Value ? Number(data.p90Value) : undefined,
      };
      const orderingErrors = validatePercentileOrdering(percentileValues, data.metricName);
      errors.push(...orderingErrors);
    }

    return errors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors([]);
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    setErrors([]);
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep(4);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    setLoading(true);
    try {
      // Build the request payload based on entry mode
      const payload: any = {
        entryMode: data.entryMode,
        industry: data.industry,
        region: data.region,
        companySize: data.companySize,
        growthStage: data.growthStage || null,
        effectiveDate: new Date(data.effectiveDate),
        sourceId: data.sourceId || null,
        sampleSize: Number(data.sampleSize),
        notes: data.notes || null,
      };

      if (data.entryMode === 'DETAILED') {
        payload.departmentHeadcount = data.departmentHeadcount;
        if (data.hasRevenueData) {
          payload.revenueData = data.revenueData;
        }
      } else {
        payload.benchmarkType = data.benchmarkType;
        payload.metricName = data.metricName;
        payload.p10Value = data.p10Value ? Number(data.p10Value) : null;
        payload.p25Value = data.p25Value ? Number(data.p25Value) : null;
        payload.p50Value = Number(data.p50Value);
        payload.p75Value = data.p75Value ? Number(data.p75Value) : null;
        payload.p90Value = data.p90Value ? Number(data.p90Value) : null;
        payload.unit = data.unit || null;
        payload.currency = data.currency || null;
      }

      await onSave(payload);
    } catch (error: any) {
      setErrors([error.message || 'Failed to save benchmark']);
      setLoading(false);
    }
  };

  // Helper: Auto-calculate total for a percentile
  const updatePercentileTotal = (percentile: 'p10' | 'p25' | 'p50' | 'p75' | 'p90') => {
    const hc = data.departmentHeadcount[percentile];
    if (!hc) return;

    const total = calculateTotalHeadcount(hc.rd, hc.gtm, hc.ga, hc.operations, hc.other);
    setData({
      ...data,
      departmentHeadcount: {
        ...data.departmentHeadcount,
        [percentile]: { ...hc, total },
      },
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step <= currentStep
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {step < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{step}</span>
                )}
              </div>
              {step < 4 && (
                <div
                  className={`h-1 w-16 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-600">Mode</span>
          <span className="text-xs text-gray-600">Context</span>
          <span className="text-xs text-gray-600">Data Entry</span>
          <span className="text-xs text-gray-600">Review</span>
        </div>
      </div>

      {/* Error display */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-sm text-red-700">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && <Step1ModeSelection data={data} setData={setData} />}
        {currentStep === 2 && <Step2Context data={data} setData={setData} sources={sources} />}
        {currentStep === 3 && data.entryMode === 'DETAILED' && (
          <Step3ADetailedEntry
            data={data}
            setData={setData}
            updatePercentileTotal={updatePercentileTotal}
          />
        )}
        {currentStep === 3 && data.entryMode === 'FALLBACK' && (
          <Step3BFallbackEntry data={data} setData={setData} />
        )}
        {currentStep === 4 && <Step4Review data={data} />}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={currentStep === 1 ? onCancel : handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>

        {currentStep < 4 ? (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save Benchmark'}
          </button>
        )}
      </div>
    </div>
  );
}

// Step 1: Mode Selection
function Step1ModeSelection({ data, setData }: { data: WizardData; setData: (data: WizardData) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Choose Data Entry Mode</h2>
        <p className="text-sm text-gray-600">
          Select how you want to enter benchmark data. Detailed mode is recommended for accuracy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detailed Mode */}
        <button
          onClick={() => setData({ ...data, entryMode: 'DETAILED' })}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            data.entryMode === 'DETAILED'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Detailed Mode</h3>
            <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
              Recommended
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Enter raw department headcount data. The system automatically calculates all metrics (ratios,
            percentages, etc.)
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Guarantees data consistency</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>All metrics calculated automatically</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Richer analysis capabilities</span>
            </div>
          </div>
        </button>

        {/* Fallback Mode */}
        <button
          onClick={() => setData({ ...data, entryMode: 'FALLBACK' })}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            data.entryMode === 'FALLBACK'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Fallback Mode</h3>
            <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
              Limited
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Enter pre-calculated metric values directly. Use when detailed department data is not available.
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <Info className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>For external benchmark sources</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <Info className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>One metric at a time</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <Info className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>Limited flexibility</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// Step 2: Context (Industry, Region, etc.)
function Step2Context({
  data,
  setData,
  sources,
}: {
  data: WizardData;
  setData: (data: WizardData) => void;
  sources: any[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Benchmark Context</h2>
        <p className="text-sm text-gray-600">
          Define the market segment this benchmark applies to. This information is used to match against user
          datasets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry <span className="text-red-600">*</span>
          </label>
          <select
            required
            value={data.industry}
            onChange={(e) => setData({ ...data, industry: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Industry --</option>
            <option value="SaaS">SaaS</option>
            <option value="Fintech">Fintech</option>
            <option value="Climate Tech">Climate Tech</option>
            <option value="E-commerce">E-commerce</option>
            <option value="Healthtech">Healthtech</option>
            <option value="Edtech">Edtech</option>
            <option value="B2B Software">B2B Software</option>
            <option value="Consumer Tech">Consumer Tech</option>
            <option value="Deep Tech">Deep Tech</option>
            <option value="Marketplace">Marketplace</option>
            <option value="Hardware">Hardware</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region <span className="text-red-600">*</span>
          </label>
          <select
            required
            value={data.region}
            onChange={(e) => setData({ ...data, region: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Region --</option>
            <option value="DACH">DACH (Germany, Austria, Switzerland)</option>
            <option value="EU">EU (Europe)</option>
            <option value="US">US (United States)</option>
            <option value="UK">UK (United Kingdom)</option>
            <option value="APAC">APAC (Asia-Pacific)</option>
            <option value="LATAM">LATAM (Latin America)</option>
            <option value="MEA">MEA (Middle East & Africa)</option>
            <option value="Global">Global</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Size <span className="text-red-600">*</span>
          </label>
          <select
            required
            value={data.companySize}
            onChange={(e) => setData({ ...data, companySize: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Company Size --</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="501-1000">501-1000 employees</option>
            <option value="1001-5000">1001-5000 employees</option>
            <option value="5000+">5000+ employees</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Growth Stage</label>
          <select
            value={data.growthStage}
            onChange={(e) => setData({ ...data, growthStage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Growth Stage (Optional) --</option>
            <option value="Seed">Seed</option>
            <option value="Series A">Series A</option>
            <option value="Series B">Series B</option>
            <option value="Series C+">Series C+</option>
            <option value="Public">Public</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Effective Date <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            required
            value={data.effectiveDate}
            onChange={(e) => setData({ ...data, effectiveDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">When this benchmark data becomes valid</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sample Size <span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            required
            min="1"
            step="1"
            value={data.sampleSize}
            onChange={(e) => setData({ ...data, sampleSize: e.target.value })}
            placeholder="e.g., 127"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Number of companies in the benchmark sample</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
          <select
            value={data.sourceId}
            onChange={(e) => setData({ ...data, sourceId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Source (Optional) --</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            rows={3}
            placeholder="Optional notes about this benchmark..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

// Step 3A: Detailed Entry (Department Headcount)
function Step3ADetailedEntry({
  data,
  setData,
  updatePercentileTotal,
}: {
  data: WizardData;
  setData: (data: WizardData) => void;
  updatePercentileTotal: (p: 'p10' | 'p25' | 'p50' | 'p75' | 'p90') => void;
}) {
  const percentileInfo = [
    { key: 'p10', label: 'P10 (10th percentile)', description: 'Bottom 10% of companies', optional: true },
    { key: 'p25', label: 'P25 (25th percentile)', description: 'Bottom quarter', optional: true },
    { key: 'p50', label: 'P50 (Median)', description: 'Middle value - REQUIRED', optional: false },
    { key: 'p75', label: 'P75 (75th percentile)', description: 'Top quarter', optional: true },
    { key: 'p90', label: 'P90 (90th percentile)', description: 'Top 10% of companies', optional: true },
  ] as const;

  const renderPercentileInputs = (percentileKey: 'p10' | 'p25' | 'p50' | 'p75' | 'p90', isRequired: boolean) => {
    const headcount = data.departmentHeadcount[percentileKey] || {
      rd: 0,
      gtm: 0,
      ga: 0,
      operations: 0,
      other: 0,
      total: 0,
    };

    const updateField = (field: keyof DepartmentHeadcount, value: number) => {
      const updated = { ...headcount, [field]: value };
      // Auto-calculate total
      if (field !== 'total') {
        updated.total = calculateTotalHeadcount(
          updated.rd,
          updated.gtm,
          updated.ga,
          updated.operations,
          updated.other
        );
      }
      setData({
        ...data,
        departmentHeadcount: {
          ...data.departmentHeadcount,
          [percentileKey]: updated,
        },
      });
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div>
          <input
            type="number"
            min="0"
            step="1"
            value={headcount.rd}
            onChange={(e) => updateField('rd', Number(e.target.value))}
            placeholder="R&D"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
          <label className="block mt-1 text-xs text-gray-500">R&D</label>
        </div>
        <div>
          <input
            type="number"
            min="0"
            step="1"
            value={headcount.gtm}
            onChange={(e) => updateField('gtm', Number(e.target.value))}
            placeholder="GTM"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
          <label className="block mt-1 text-xs text-gray-500">GTM</label>
        </div>
        <div>
          <input
            type="number"
            min="0"
            step="1"
            value={headcount.ga}
            onChange={(e) => updateField('ga', Number(e.target.value))}
            placeholder="G&A"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
          <label className="block mt-1 text-xs text-gray-500">G&A</label>
        </div>
        <div>
          <input
            type="number"
            min="0"
            step="1"
            value={headcount.operations}
            onChange={(e) => updateField('operations', Number(e.target.value))}
            placeholder="Ops"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
          <label className="block mt-1 text-xs text-gray-500">Ops</label>
        </div>
        <div>
          <input
            type="number"
            min="0"
            step="1"
            value={headcount.other}
            onChange={(e) => updateField('other', Number(e.target.value))}
            placeholder="Other"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
          <label className="block mt-1 text-xs text-gray-500">Other</label>
        </div>
        <div>
          <input
            type="number"
            disabled
            value={headcount.total}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 font-medium"
          />
          <label className="block mt-1 text-xs text-gray-500">Total (auto)</label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Department Headcount Data</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter the number of employees in each department category for each percentile. The system will automatically
          calculate all metrics (R&D:GTM ratio, department percentages, etc.)
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Categories match your user data:</strong> R&D (Engineering, Product), GTM (Sales, Marketing,
            Customer Success), G&A (Finance, HR, Legal), Operations (IT, Facilities), Other
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {percentileInfo.map(({ key, label, description, optional }) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {label}
                  {!optional && <span className="text-red-600 ml-1">*</span>}
                </h3>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
              {optional && (
                <button
                  onClick={() => {
                    const updated = { ...data.departmentHeadcount };
                    if (updated[key]) {
                      delete updated[key];
                    } else {
                      updated[key] = { rd: 0, gtm: 0, ga: 0, operations: 0, other: 0, total: 0 };
                    }
                    setData({ ...data, departmentHeadcount: updated });
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {data.departmentHeadcount[key] ? 'Remove' : 'Add'}
                </button>
              )}
            </div>
            {(data.departmentHeadcount[key] || key === 'p50') && renderPercentileInputs(key, !optional)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 3B: Fallback Entry (Direct Metrics)
function Step3BFallbackEntry({
  data,
  setData,
}: {
  data: WizardData;
  setData: (data: WizardData) => void;
}) {
  const metricsByType: Record<string, { value: string; label: string; unit: string; currency?: string }[]> = {
    STRUCTURE: [
      { value: 'rd_to_gtm_ratio', label: 'R&D to GTM Ratio', unit: 'ratio' },
      { value: 'span_of_control', label: 'Span of Control (avg reports per manager)', unit: 'reports' },
      { value: 'rd_percentage', label: 'R&D Percentage of Total Headcount', unit: '%' },
      { value: 'gtm_percentage', label: 'GTM Percentage of Total Headcount', unit: '%' },
    ],
    EFFICIENCY: [
      { value: 'revenue_per_fte', label: 'Revenue per FTE', unit: 'EUR', currency: 'EUR' },
      { value: 'revenue_per_rd_fte', label: 'Revenue per R&D FTE', unit: 'EUR', currency: 'EUR' },
      { value: 'cost_per_fte', label: 'Cost per FTE', unit: 'EUR', currency: 'EUR' },
    ],
    TENURE: [
      { value: 'avg_tenure_months', label: 'Average Tenure', unit: 'months' },
      { value: 'retention_rate', label: 'Retention Rate', unit: '%' },
    ],
  };

  const handleMetricChange = (metricValue: string) => {
    const allMetrics = [...metricsByType.STRUCTURE, ...metricsByType.EFFICIENCY, ...metricsByType.TENURE];
    const metric = allMetrics.find((m) => m.value === metricValue);

    if (metric) {
      setData({
        ...data,
        metricName: metricValue,
        unit: metric.unit,
        currency: metric.currency || '',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Enter Metric Values</h2>
        <p className="text-sm text-gray-600">
          Enter pre-calculated percentile values for a single metric. Use Detailed Mode for entering multiple
          metrics at once.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Benchmark Type <span className="text-red-600">*</span>
          </label>
          <select
            required
            value={data.benchmarkType}
            onChange={(e) =>
              setData({ ...data, benchmarkType: e.target.value as 'STRUCTURE' | 'EFFICIENCY' | 'TENURE' })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="STRUCTURE">Structure (ratios, percentages, span)</option>
            <option value="EFFICIENCY">Efficiency (revenue/FTE, costs)</option>
            <option value="TENURE">Tenure (retention, avg tenure)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Metric <span className="text-red-600">*</span>
          </label>
          <select
            required
            value={data.metricName}
            onChange={(e) => handleMetricChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Metric --</option>
            {metricsByType[data.benchmarkType].map((metric) => (
              <option key={metric.value} value={metric.value}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Percentile Values</h3>
        <p className="text-xs text-gray-600 mb-4">
          Enter numeric values only. Ensure P10 ≤ P25 ≤ P50 ≤ P75 ≤ P90. P50 (median) is required.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">P10</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.p10Value}
              onChange={(e) => setData({ ...data, p10Value: e.target.value })}
              placeholder="Optional"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">P25</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.p25Value}
              onChange={(e) => setData({ ...data, p25Value: e.target.value })}
              placeholder="Optional"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              P50 <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={data.p50Value}
              onChange={(e) => setData({ ...data, p50Value: e.target.value })}
              placeholder="Required"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">P75</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.p75Value}
              onChange={(e) => setData({ ...data, p75Value: e.target.value })}
              placeholder="Optional"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">P90</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.p90Value}
              onChange={(e) => setData({ ...data, p90Value: e.target.value })}
              placeholder="Optional"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Unit (auto-filled)</label>
            <input
              type="text"
              value={data.unit}
              onChange={(e) => setData({ ...data, unit: e.target.value })}
              placeholder="e.g., ratio, %, months"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {data.currency && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Currency (auto-filled)</label>
              <input
                type="text"
                value={data.currency}
                onChange={(e) => setData({ ...data, currency: e.target.value })}
                placeholder="e.g., EUR, USD"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 4: Review
function Step4Review({ data }: { data: WizardData }) {
  const renderDetailedPreview = () => {
    if (!data.departmentHeadcount.p50) return null;

    const metrics = calculateMetricsFromHeadcount(data.departmentHeadcount.p50);

    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Median (P50) Department Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
            <div>
              <p className="text-gray-500">R&D</p>
              <p className="font-medium">{data.departmentHeadcount.p50.rd}</p>
            </div>
            <div>
              <p className="text-gray-500">GTM</p>
              <p className="font-medium">{data.departmentHeadcount.p50.gtm}</p>
            </div>
            <div>
              <p className="text-gray-500">G&A</p>
              <p className="font-medium">{data.departmentHeadcount.p50.ga}</p>
            </div>
            <div>
              <p className="text-gray-500">Operations</p>
              <p className="font-medium">{data.departmentHeadcount.p50.operations}</p>
            </div>
            <div>
              <p className="text-gray-500">Other</p>
              <p className="font-medium">{data.departmentHeadcount.p50.other}</p>
            </div>
            <div>
              <p className="text-gray-500">Total</p>
              <p className="font-medium text-blue-600">{data.departmentHeadcount.p50.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-2">Auto-Calculated Metrics (P50)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-green-700">R&D:GTM Ratio</p>
              <p className="font-medium text-green-900">{metrics.rd_to_gtm_ratio}</p>
            </div>
            <div>
              <p className="text-green-700">R&D %</p>
              <p className="font-medium text-green-900">{metrics.rd_percentage}%</p>
            </div>
            <div>
              <p className="text-green-700">GTM %</p>
              <p className="font-medium text-green-900">{metrics.gtm_percentage}%</p>
            </div>
            <div>
              <p className="text-green-700">G&A %</p>
              <p className="font-medium text-green-900">{metrics.ga_percentage}%</p>
            </div>
            <div>
              <p className="text-green-700">Ops %</p>
              <p className="font-medium text-green-900">{metrics.operations_percentage}%</p>
            </div>
            <div>
              <p className="text-green-700">Other %</p>
              <p className="font-medium text-green-900">{metrics.other_percentage}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFallbackPreview = () => {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Metric Values</h4>
          <div className="grid grid-cols-5 gap-4 text-sm">
            {data.p10Value && (
              <div>
                <p className="text-gray-500">P10</p>
                <p className="font-medium">{data.p10Value}</p>
              </div>
            )}
            {data.p25Value && (
              <div>
                <p className="text-gray-500">P25</p>
                <p className="font-medium">{data.p25Value}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">P50</p>
              <p className="font-medium text-blue-600">{data.p50Value}</p>
            </div>
            {data.p75Value && (
              <div>
                <p className="text-gray-500">P75</p>
                <p className="font-medium">{data.p75Value}</p>
              </div>
            )}
            {data.p90Value && (
              <div>
                <p className="text-gray-500">P90</p>
                <p className="font-medium">{data.p90Value}</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Unit: <span className="font-medium">{data.unit}</span>
            {data.currency && (
              <>
                {' '}
                | Currency: <span className="font-medium">{data.currency}</span>
              </>
            )}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Review & Confirm</h2>
        <p className="text-sm text-gray-600">
          Please review all information before saving. You can go back to make changes if needed.
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Benchmark Context</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Entry Mode</p>
              <p className="font-medium">
                {data.entryMode === 'DETAILED' ? 'Detailed (Headcount)' : 'Fallback (Metrics)'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Industry</p>
              <p className="font-medium">{data.industry}</p>
            </div>
            <div>
              <p className="text-gray-500">Region</p>
              <p className="font-medium">{data.region}</p>
            </div>
            <div>
              <p className="text-gray-500">Company Size</p>
              <p className="font-medium">{data.companySize}</p>
            </div>
            {data.growthStage && (
              <div>
                <p className="text-gray-500">Growth Stage</p>
                <p className="font-medium">{data.growthStage}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Effective Date</p>
              <p className="font-medium">{data.effectiveDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Sample Size</p>
              <p className="font-medium">{data.sampleSize} companies</p>
            </div>
          </div>
          {data.notes && (
            <div className="mt-4">
              <p className="text-gray-500 text-sm">Notes</p>
              <p className="text-sm text-gray-700">{data.notes}</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Benchmark Data</h3>
          {data.entryMode === 'DETAILED' ? renderDetailedPreview() : renderFallbackPreview()}
        </div>
      </div>
    </div>
  );
}
