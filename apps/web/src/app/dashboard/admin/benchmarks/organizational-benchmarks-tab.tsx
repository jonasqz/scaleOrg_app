'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import type { BenchmarkType } from '@scleorg/types';

interface OrganizationalBenchmark {
  id: string;
  industry: string;
  region: string;
  companySize: string;
  growthStage?: string | null;
  benchmarkType: BenchmarkType;
  metricName: string;
  p10Value?: number | null;
  p25Value?: number | null;
  p50Value?: number | null;
  p75Value?: number | null;
  p90Value?: number | null;
  sampleSize: number;
  currency?: string | null;
  unit?: string | null;
  sourceId?: string | null;
  source?: { id: string; name: string } | null;
  effectiveDate: Date | string;
  expirationDate?: Date | string | null;
  notes?: string | null;
  methodology?: string | null;
  createdAt: Date | string;
}

interface Props {
  initialBenchmarks: OrganizationalBenchmark[];
  sources: any[];
  uniqueIndustries: string[];
  uniqueRegions: string[];
  uniqueCompanySizes: string[];
}

export default function OrganizationalBenchmarksTab({
  initialBenchmarks,
  sources,
  uniqueIndustries,
  uniqueRegions,
  uniqueCompanySizes,
}: Props) {
  const [benchmarks, setBenchmarks] = useState(initialBenchmarks);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    industry: '',
    region: '',
    companySize: '',
    growthStage: '',
    benchmarkType: 'STRUCTURE' as BenchmarkType,
    metricName: '',
    p10Value: '',
    p25Value: '',
    p50Value: '',
    p75Value: '',
    p90Value: '',
    sampleSize: '',
    currency: 'EUR',
    unit: '',
    sourceId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    notes: '',
    methodology: '',
  });

  const resetForm = () => {
    setFormData({
      industry: '',
      region: '',
      companySize: '',
      growthStage: '',
      benchmarkType: 'STRUCTURE' as BenchmarkType,
      metricName: '',
      p10Value: '',
      p25Value: '',
      p50Value: '',
      p75Value: '',
      p90Value: '',
      sampleSize: '',
      currency: 'EUR',
      unit: '',
      sourceId: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      expirationDate: '',
      notes: '',
      methodology: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      industry: formData.industry,
      region: formData.region,
      companySize: formData.companySize,
      growthStage: formData.growthStage || null,
      benchmarkType: formData.benchmarkType,
      metricName: formData.metricName,
      p10Value: formData.p10Value ? Number(formData.p10Value) : null,
      p25Value: formData.p25Value ? Number(formData.p25Value) : null,
      p50Value: formData.p50Value ? Number(formData.p50Value) : null,
      p75Value: formData.p75Value ? Number(formData.p75Value) : null,
      p90Value: formData.p90Value ? Number(formData.p90Value) : null,
      sampleSize: Number(formData.sampleSize),
      currency: formData.currency || null,
      unit: formData.unit || null,
      sourceId: formData.sourceId || null,
      effectiveDate: formData.effectiveDate,
      expirationDate: formData.expirationDate || null,
      notes: formData.notes || null,
      methodology: formData.methodology || null,
    };

    const url = editingId
      ? `/api/admin/benchmarks/organizational/${editingId}`
      : '/api/admin/benchmarks/organizational';
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      setMessage({ type: 'success', text: editingId ? 'Benchmark updated!' : 'Benchmark created!' });

      if (editingId) {
        setBenchmarks(benchmarks.map((b) => (b.id === editingId ? data : b)));
      } else {
        setBenchmarks([data, ...benchmarks]);
      }

      resetForm();
      setTimeout(() => setMessage(null), 3000);
    } else {
      const error = await res.json();
      setMessage({ type: 'error', text: error.error || 'Failed to save benchmark' });
    }
  };

  const handleEdit = (benchmark: OrganizationalBenchmark) => {
    setFormData({
      industry: benchmark.industry,
      region: benchmark.region,
      companySize: benchmark.companySize,
      growthStage: benchmark.growthStage || '',
      benchmarkType: benchmark.benchmarkType,
      metricName: benchmark.metricName,
      p10Value: benchmark.p10Value?.toString() || '',
      p25Value: benchmark.p25Value?.toString() || '',
      p50Value: benchmark.p50Value?.toString() || '',
      p75Value: benchmark.p75Value?.toString() || '',
      p90Value: benchmark.p90Value?.toString() || '',
      sampleSize: benchmark.sampleSize.toString(),
      currency: benchmark.currency || 'EUR',
      unit: benchmark.unit || '',
      sourceId: benchmark.sourceId || '',
      effectiveDate: typeof benchmark.effectiveDate === 'string'
        ? benchmark.effectiveDate.split('T')[0]
        : new Date(benchmark.effectiveDate).toISOString().split('T')[0],
      expirationDate: benchmark.expirationDate
        ? (typeof benchmark.expirationDate === 'string'
          ? benchmark.expirationDate.split('T')[0]
          : new Date(benchmark.expirationDate).toISOString().split('T')[0])
        : '',
      notes: benchmark.notes || '',
      methodology: benchmark.methodology || '',
    });
    setEditingId(benchmark.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this benchmark?')) return;

    const res = await fetch(`/api/admin/benchmarks/organizational/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setBenchmarks(benchmarks.filter((b) => b.id !== id));
      setMessage({ type: 'success', text: 'Benchmark deleted' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      const error = await res.json();
      setMessage({ type: 'error', text: error.error || 'Failed to delete' });
    }
  };

  const metricsByType = {
    STRUCTURE: [
      'rd_to_gtm_ratio',
      'manager_to_ic_ratio',
      'span_of_control',
      'rd_percentage',
      'gtm_percentage',
      'ga_percentage',
      'ops_percentage',
    ],
    EFFICIENCY: [
      'revenue_per_fte',
      'cost_per_fte',
      'revenue_per_sales_fte',
      'revenue_per_marketing_fte',
      'gross_margin_percentage',
      'net_revenue_retention',
    ],
    TENURE: [
      'avg_tenure_months',
      'annual_retention_rate',
      'time_to_promotion_months',
      'new_hire_90day_retention',
      'voluntary_turnover_rate',
    ],
  };

  // Auto-fill unit and currency based on metric selection
  const getMetricDefaults = (metricName: string) => {
    const defaults: { unit: string; currency: string } = { unit: '', currency: '' };

    // Ratio metrics
    if (metricName.includes('ratio')) {
      defaults.unit = 'ratio';
      defaults.currency = '';
    }
    // Percentage metrics
    else if (metricName.includes('percentage') || metricName.includes('retention') || metricName.includes('rate')) {
      defaults.unit = '%';
      defaults.currency = '';
    }
    // Time-based metrics
    else if (metricName.includes('months') || metricName.includes('days')) {
      defaults.unit = metricName.includes('months') ? 'months' : 'days';
      defaults.currency = '';
    }
    // Span of control
    else if (metricName === 'span_of_control') {
      defaults.unit = 'reports';
      defaults.currency = '';
    }
    // Revenue/cost metrics - monetary
    else if (metricName.includes('revenue') || metricName.includes('cost')) {
      defaults.unit = 'EUR';
      defaults.currency = 'EUR';
    }

    return defaults;
  };

  // Update metric name handler to auto-fill unit and currency
  const handleMetricChange = (metricName: string) => {
    const defaults = getMetricDefaults(metricName);
    setFormData({
      ...formData,
      metricName,
      unit: defaults.unit,
      currency: defaults.currency,
    });
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Organizational Benchmarks ({benchmarks.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Benchmark
            </>
          )}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            {editingId ? 'Edit Benchmark' : 'New Benchmark'}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Market Segmentation */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Industry *</label>
              <select
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Select Industry --</option>
                <option value="SaaS">SaaS</option>
                <option value="Fintech">Fintech</option>
                <option value="Climate Tech">Climate Tech</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="Healthcare Tech">Healthcare Tech</option>
                <option value="EdTech">EdTech</option>
                <option value="Enterprise Software">Enterprise Software</option>
                <option value="Consumer Tech">Consumer Tech</option>
                <option value="Deep Tech">Deep Tech</option>
                <option value="Marketplace">Marketplace</option>
                <option value="Hardware">Hardware</option>
                <option value="Other">Other</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">The industry vertical - standardized categories for reliable matching</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Region *</label>
              <select
                required
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <p className="mt-1 text-xs text-gray-500">Geographic market - select the most specific region available</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company Size *</label>
              <select
                required
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Select Size --</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1001-5000">1001-5000 employees</option>
                <option value="5001+">5001+ employees</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Headcount range - ensures consistent grouping across benchmarks</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Growth Stage</label>
              <select
                value={formData.growthStage}
                onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Select --</option>
                <option value="Seed">Seed</option>
                <option value="Series A">Series A</option>
                <option value="Series B">Series B</option>
                <option value="Series C+">Series C+</option>
                <option value="Public">Public</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Optional: Funding stage for more granular benchmarking</p>
            </div>

            {/* Metric Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Benchmark Type *</label>
              <select
                required
                value={formData.benchmarkType}
                onChange={(e) =>
                  setFormData({ ...formData, benchmarkType: e.target.value as BenchmarkType, metricName: '' })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="STRUCTURE">Structure</option>
                <option value="EFFICIENCY">Efficiency</option>
                <option value="TENURE">Tenure</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Structure: org ratios • Efficiency: productivity • Tenure: retention</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Metric Name *</label>
              <select
                required
                value={formData.metricName}
                onChange={(e) => handleMetricChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Select --</option>
                {metricsByType[formData.benchmarkType].map((metric) => (
                  <option key={metric} value={metric}>
                    {metric.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">The specific metric being benchmarked (auto-fills Unit & Currency)</p>
            </div>

            {/* Percentile Values */}
            <div>
              <label className="block text-sm font-medium text-gray-700">P10 Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.p10Value}
                onChange={(e) => setFormData({ ...formData, p10Value: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">10th percentile - bottom 10% of companies</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">P25 Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.p25Value}
                onChange={(e) => setFormData({ ...formData, p25Value: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">25th percentile - lower quartile</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">P50 Value (Median) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.p50Value}
                onChange={(e) => setFormData({ ...formData, p50Value: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">50th percentile - middle/typical value (required)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">P75 Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.p75Value}
                onChange={(e) => setFormData({ ...formData, p75Value: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">75th percentile - upper quartile</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">P90 Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.p90Value}
                onChange={(e) => setFormData({ ...formData, p90Value: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">90th percentile - top 10% of companies</p>
            </div>

            {/* Quality & Metadata */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Sample Size *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.sampleSize}
                onChange={(e) => setFormData({ ...formData, sampleSize: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Number of companies in this benchmark dataset</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <input
                type="text"
                placeholder="e.g., ratio, %, EUR, days"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Auto-filled based on metric • Edit if needed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- None --</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Auto-set for revenue/cost metrics • Change if different currency needed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Data Source</label>
              <select
                value={formData.sourceId}
                onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Select Source --</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Where this benchmark data came from (Pave, Radford, manual entry, etc.)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Effective Date *</label>
              <input
                type="date"
                required
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">When this benchmark becomes valid/active</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Optional: When this benchmark should no longer be used</p>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Methodology</label>
              <textarea
                rows={2}
                placeholder="How was this data collected?"
                value={formData.methodology}
                onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : editingId ? 'Update Benchmark' : 'Create Benchmark'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Benchmarks Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Metric
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Market
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                P50 (Median)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Sample Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Effective Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Source
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {benchmarks.map((benchmark) => (
              <tr key={benchmark.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{benchmark.metricName.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-gray-500">{benchmark.benchmarkType}</div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  <div>{benchmark.industry}</div>
                  <div className="text-xs">
                    {benchmark.region} • {benchmark.companySize}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {benchmark.p50Value ? Number(benchmark.p50Value).toFixed(2) : '—'} {benchmark.unit}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {benchmark.sampleSize}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {new Date(benchmark.effectiveDate).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {benchmark.source?.name || '—'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(benchmark)}
                    className="mr-3 text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(benchmark.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
