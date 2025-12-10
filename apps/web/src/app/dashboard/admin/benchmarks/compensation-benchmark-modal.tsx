'use client';

import { useState, useEffect } from 'react';
import { X, Save, DollarSign, Info } from 'lucide-react';
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

export default function CompensationBenchmarkModal({ isOpen, onClose, benchmark, filters }: Props) {
  const [loading, setLoading] = useState(false);
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
                    <option value="customer_crowdsourced">Customer Crowdsourced</option>
                    <option value="pave">Pave</option>
                    <option value="radford">Radford</option>
                    <option value="opencomp">OpenComp</option>
                  </select>
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
