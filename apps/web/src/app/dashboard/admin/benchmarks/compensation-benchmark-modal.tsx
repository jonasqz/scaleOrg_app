'use client';

import { useState, useEffect } from 'react';
import { X, Save, DollarSign, Info, Sparkles, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface CompensationBenchmark {
  id: string;
  roleFamily: string;
  standardizedTitle: string;
  seniorityLevel: string;
  industry: string;
  region: string;
  companySize: string;
  p10TotalComp: number | null;
  p25TotalComp: number | null;
  p50TotalComp: number | null;
  p75TotalComp: number | null;
  p90TotalComp: number | null;
  p10BaseSalary: number | null;
  p25BaseSalary: number | null;
  p50BaseSalary: number | null;
  p75BaseSalary: number | null;
  p90BaseSalary: number | null;
  sampleSize: number;
  currency: string;
  dataSource: string;
}

interface Filters {
  roleFamilies: string[];
  industries: string[];
  regions: string[];
  companySizes: string[];
  seniorityLevels: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  benchmark: CompensationBenchmark | null;
  filters: Filters;
}

const ROLE_FAMILIES = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Customer Success',
  'Operations',
  'People & Talent',
  'Finance',
  'Legal',
  'Data',
];

const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior', 'Staff', 'Manager', 'Director', 'VP', 'C-Level'];

const INDUSTRIES = ['SaaS', 'Fintech', 'E-commerce', 'Climate Tech', 'HealthTech', 'EdTech', 'Other'];

const REGIONS = ['DACH', 'EU', 'US', 'UK', 'APAC', 'Global'];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

interface AIResearchResult {
  suggested: {
    p10TotalComp: number | null;
    p25TotalComp: number | null;
    p50TotalComp: number | null;
    p75TotalComp: number | null;
    p90TotalComp: number | null;
    p10BaseSalary: number | null;
    p25BaseSalary: number | null;
    p50BaseSalary: number | null;
    p75BaseSalary: number | null;
    p90BaseSalary: number | null;
    sampleSizeEstimate: number;
  };
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  warnings: string[];
}

export default function CompensationBenchmarkModal({ isOpen, onClose, benchmark, filters }: Props) {
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [aiResult, setAiResult] = useState<AIResearchResult | null>(null);
  const [formData, setFormData] = useState({
    roleFamily: '',
    standardizedTitle: '',
    seniorityLevel: '',
    industry: '',
    region: '',
    companySize: '',
    p10TotalComp: '',
    p25TotalComp: '',
    p50TotalComp: '',
    p75TotalComp: '',
    p90TotalComp: '',
    p10BaseSalary: '',
    p25BaseSalary: '',
    p50BaseSalary: '',
    p75BaseSalary: '',
    p90BaseSalary: '',
    sampleSize: '',
    currency: 'EUR',
    dataSource: 'manual',
  });

  useEffect(() => {
    if (benchmark) {
      setFormData({
        roleFamily: benchmark.roleFamily,
        standardizedTitle: benchmark.standardizedTitle,
        seniorityLevel: benchmark.seniorityLevel,
        industry: benchmark.industry,
        region: benchmark.region,
        companySize: benchmark.companySize,
        p10TotalComp: benchmark.p10TotalComp?.toString() || '',
        p25TotalComp: benchmark.p25TotalComp?.toString() || '',
        p50TotalComp: benchmark.p50TotalComp?.toString() || '',
        p75TotalComp: benchmark.p75TotalComp?.toString() || '',
        p90TotalComp: benchmark.p90TotalComp?.toString() || '',
        p10BaseSalary: benchmark.p10BaseSalary?.toString() || '',
        p25BaseSalary: benchmark.p25BaseSalary?.toString() || '',
        p50BaseSalary: benchmark.p50BaseSalary?.toString() || '',
        p75BaseSalary: benchmark.p75BaseSalary?.toString() || '',
        p90BaseSalary: benchmark.p90BaseSalary?.toString() || '',
        sampleSize: benchmark.sampleSize.toString(),
        currency: benchmark.currency,
        dataSource: benchmark.dataSource,
      });
    }
  }, [benchmark]);

  if (!isOpen) return null;

  const handleAIResearch = async () => {
    // Validation
    if (!formData.roleFamily || !formData.standardizedTitle || !formData.seniorityLevel ||
        !formData.industry || !formData.region || !formData.companySize) {
      toast.error('Please fill in role and market segmentation fields before researching');
      return;
    }

    setResearching(true);
    setAiResult(null);

    try {
      const response = await fetch('/api/admin/benchmarks/compensation/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleFamily: formData.roleFamily,
          standardizedTitle: formData.standardizedTitle,
          seniorityLevel: formData.seniorityLevel,
          industry: formData.industry,
          region: formData.region,
          companySize: formData.companySize,
          currency: formData.currency,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Research failed');
      }

      const result = await response.json();
      setAiResult(result);
      toast.success('AI research completed! Review the suggested values below.');
    } catch (error: any) {
      console.error('Error researching compensation:', error);
      toast.error(error.message || 'Failed to research compensation data');
    } finally {
      setResearching(false);
    }
  };

  const handleApplySuggestions = () => {
    if (!aiResult) return;

    setFormData({
      ...formData,
      p10TotalComp: aiResult.suggested.p10TotalComp?.toString() || '',
      p25TotalComp: aiResult.suggested.p25TotalComp?.toString() || '',
      p50TotalComp: aiResult.suggested.p50TotalComp?.toString() || '',
      p75TotalComp: aiResult.suggested.p75TotalComp?.toString() || '',
      p90TotalComp: aiResult.suggested.p90TotalComp?.toString() || '',
      p10BaseSalary: aiResult.suggested.p10BaseSalary?.toString() || '',
      p25BaseSalary: aiResult.suggested.p25BaseSalary?.toString() || '',
      p50BaseSalary: aiResult.suggested.p50BaseSalary?.toString() || '',
      p75BaseSalary: aiResult.suggested.p75BaseSalary?.toString() || '',
      p90BaseSalary: aiResult.suggested.p90BaseSalary?.toString() || '',
      sampleSize: aiResult.suggested.sampleSizeEstimate.toString(),
      dataSource: 'ai_suggested',
    });

    toast.success('AI suggestions applied! You can adjust values before saving.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.roleFamily || !formData.standardizedTitle || !formData.seniorityLevel) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!formData.p50TotalComp && !formData.p50BaseSalary) {
        toast.error('At least p50 Total Compensation or p50 Base Salary must be provided');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        p10TotalComp: formData.p10TotalComp ? parseFloat(formData.p10TotalComp) : null,
        p25TotalComp: formData.p25TotalComp ? parseFloat(formData.p25TotalComp) : null,
        p50TotalComp: formData.p50TotalComp ? parseFloat(formData.p50TotalComp) : null,
        p75TotalComp: formData.p75TotalComp ? parseFloat(formData.p75TotalComp) : null,
        p90TotalComp: formData.p90TotalComp ? parseFloat(formData.p90TotalComp) : null,
        p10BaseSalary: formData.p10BaseSalary ? parseFloat(formData.p10BaseSalary) : null,
        p25BaseSalary: formData.p25BaseSalary ? parseFloat(formData.p25BaseSalary) : null,
        p50BaseSalary: formData.p50BaseSalary ? parseFloat(formData.p50BaseSalary) : null,
        p75BaseSalary: formData.p75BaseSalary ? parseFloat(formData.p75BaseSalary) : null,
        p90BaseSalary: formData.p90BaseSalary ? parseFloat(formData.p90BaseSalary) : null,
        sampleSize: parseInt(formData.sampleSize) || 0,
      };

      const url = benchmark
        ? `/api/admin/benchmarks/compensation/${benchmark.id}`
        : '/api/admin/benchmarks/compensation';

      const method = benchmark ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save benchmark');

      toast.success(benchmark ? 'Benchmark updated successfully' : 'Benchmark created successfully');
      onClose();
    } catch (error) {
      console.error('Error saving benchmark:', error);
      toast.error('Failed to save benchmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {benchmark ? 'Edit Compensation Benchmark' : 'Add Compensation Benchmark'}
              </h2>
              <p className="text-sm text-gray-500">
                Market compensation data for role-based employee comparisons
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Role Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Role Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Role Family <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.roleFamily}
                    onChange={(e) => setFormData({ ...formData, roleFamily: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select role family...</option>
                    {ROLE_FAMILIES.map((rf) => (
                      <option key={rf} value={rf}>
                        {rf}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Standardized Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.standardizedTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, standardizedTitle: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Software Engineer, Account Executive"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Seniority Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.seniorityLevel}
                    onChange={(e) => setFormData({ ...formData, seniorityLevel: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select seniority...</option>
                    {SENIORITY_LEVELS.map((sl) => (
                      <option key={sl} value={sl}>
                        {sl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Market Segmentation */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Market Segmentation</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select region...</option>
                    {REGIONS.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Company Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.companySize}
                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select size...</option>
                    {COMPANY_SIZES.map((cs) => (
                      <option key={cs} value={cs}>
                        {cs}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* AI Research Section */}
            <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">AI Compensation Research</h3>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                      Beta
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Let AI research current market compensation data for this role using web search.
                    Review and adjust the suggestions before saving.
                  </p>

                  <button
                    type="button"
                    onClick={handleAIResearch}
                    disabled={researching || !formData.roleFamily || !formData.seniorityLevel}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2.5 font-semibold text-white hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {researching ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Research with AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI Research Results */}
              {aiResult && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-lg border border-purple-200 bg-white p-4">
                    {/* Confidence Badge */}
                    <div className="mb-3 flex items-center gap-2">
                      {aiResult.confidence === 'high' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {aiResult.confidence === 'medium' && (
                        <Info className="h-5 w-5 text-yellow-600" />
                      )}
                      {aiResult.confidence === 'low' && (
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      )}
                      <span className="font-semibold text-gray-900">
                        AI Research Results
                      </span>
                      <span className={`ml-auto rounded-full px-2 py-1 text-xs font-semibold ${
                        aiResult.confidence === 'high' ? 'bg-green-100 text-green-700' :
                        aiResult.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {aiResult.confidence.toUpperCase()} Confidence
                      </span>
                    </div>

                    {/* Suggested Values Preview */}
                    <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Suggested Compensation (Annual {formData.currency})</div>
                      <div className="grid grid-cols-5 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500">p10</div>
                          <div className="font-semibold">{aiResult.suggested.p10TotalComp?.toLocaleString() || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">p25</div>
                          <div className="font-semibold">{aiResult.suggested.p25TotalComp?.toLocaleString() || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">p50</div>
                          <div className="font-semibold text-purple-600">{aiResult.suggested.p50TotalComp?.toLocaleString() || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">p75</div>
                          <div className="font-semibold">{aiResult.suggested.p75TotalComp?.toLocaleString() || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">p90</div>
                          <div className="font-semibold">{aiResult.suggested.p90TotalComp?.toLocaleString() || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="mb-3 text-sm text-gray-600">
                      <span className="font-medium text-gray-700">Reasoning:</span> {aiResult.reasoning}
                    </div>

                    {/* Sources */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Sources:</div>
                      <ul className="space-y-1">
                        {aiResult.sources.map((source, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                            <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{source}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Warnings */}
                    {aiResult.warnings.length > 0 && (
                      <div className="mb-3 rounded-md bg-yellow-50 border border-yellow-200 p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-yellow-800">
                            <div className="font-medium mb-1">Caveats:</div>
                            <ul className="list-disc list-inside space-y-0.5">
                              {aiResult.warnings.map((warning, idx) => (
                                <li key={idx}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Apply Button */}
                    <button
                      type="button"
                      onClick={handleApplySuggestions}
                      className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
                    >
                      Apply AI Suggestions to Form
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Total Compensation Percentiles */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Compensation Percentiles
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Info className="h-4 w-4" />
                  <span>At least p50 (median) is required</span>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-5">
                {['p10', 'p25', 'p50', 'p75', 'p90'].map((percentile) => (
                  <div key={percentile}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {percentile.toUpperCase()}
                      {percentile === 'p50' && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                      type="number"
                      value={formData[`${percentile}TotalComp` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`${percentile}TotalComp`]: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Base Salary Percentiles */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Base Salary Percentiles <span className="text-sm font-normal text-gray-500">(Optional)</span>
              </h3>
              <div className="grid gap-4 md:grid-cols-5">
                {['p10', 'p25', 'p50', 'p75', 'p90'].map((percentile) => (
                  <div key={percentile}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {percentile.toUpperCase()}
                    </label>
                    <input
                      type="number"
                      value={formData[`${percentile}BaseSalary` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [`${percentile}BaseSalary`]: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Data Quality</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Sample Size <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.sampleSize}
                    onChange={(e) => setFormData({ ...formData, sampleSize: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Number of data points"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Data Source</label>
                  <select
                    value={formData.dataSource}
                    onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="ai_suggested">AI Suggested ✨</option>
                    <option value="customer_crowdsourced">Customer Crowdsourced</option>
                    <option value="pave">Pave</option>
                    <option value="radford">Radford</option>
                    <option value="opencomp">OpenComp</option>
                  </select>
                  {formData.dataSource === 'ai_suggested' && (
                    <p className="mt-1 text-xs text-purple-600">
                      This benchmark was researched by AI. Review and verify before using.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : benchmark ? 'Update Benchmark' : 'Create Benchmark'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
