'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { INDUSTRIES, REGIONS, GROWTH_STAGES } from '@/lib/benchmarking-constants';

export default function NewDatasetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyName: '',
    // Benchmarking settings
    industry: '',
    region: '',
    growthStage: '',
    // Financial data
    totalRevenue: '',
    currentCashBalance: '',
    currency: 'EUR',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          companyName: formData.companyName || null,
          currency: formData.currency,
          totalRevenue: formData.totalRevenue ? parseFloat(formData.totalRevenue) : null,
          currentCashBalance: formData.currentCashBalance ? parseFloat(formData.currentCashBalance) : null,
          fileName: 'Manual Entry',
          fileUrl: '',
          fileType: 'manual',
          status: 'READY',
          // Benchmarking settings (will be saved to DatasetSettings)
          benchmarking: {
            industry: formData.industry || null,
            region: formData.region || null,
            growthStage: formData.growthStage || null,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to create company');

      const { dataset } = await response.json();
      router.push(`/dashboard/datasets/${dataset.id}`);
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="container mx-auto px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-2xl px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            Create New Company
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Set up a new company to analyze
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Company Information
            </h2>

            <div className="space-y-3">
              {/* Company Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-xs font-medium text-stone-700"
                >
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="e.g., Acme Corp - Q4 2024"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-1 block text-xs font-medium text-stone-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="Optional description..."
                />
              </div>

              {/* Company Name */}
              <div>
                <label
                  htmlFor="companyName"
                  className="mb-1 block text-xs font-medium text-stone-700"
                >
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="e.g., Acme Corp"
                />
              </div>
            </div>
          </div>

          {/* Benchmarking Settings */}
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Benchmarking Settings
            </h2>
            <p className="mb-3 text-xs text-stone-600">
              Configure these settings to get more accurate benchmark comparisons for your organization.
            </p>

            <div className="space-y-3">
              {/* Industry */}
              <div>
                <label
                  htmlFor="industry"
                  className="mb-1 block text-xs font-medium text-stone-700"
                >
                  Industry <span className="text-red-500">*</span>
                </label>
                <select
                  id="industry"
                  required
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry.value} value={industry.value}>
                      {industry.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-stone-500">
                  Industry vertical for benchmarking
                </p>
              </div>

              {/* Region */}
              <div>
                <label
                  htmlFor="region"
                  className="mb-1 block text-xs font-medium text-stone-700"
                >
                  Region
                </label>
                <select
                  id="region"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {REGIONS.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-stone-500">
                  Geographic region for comparison
                </p>
              </div>

              {/* Growth Stage */}
              <div>
                <label
                  htmlFor="growthStage"
                  className="mb-1 block text-xs font-medium text-stone-700"
                >
                  Growth Stage
                </label>
                <select
                  id="growthStage"
                  value={formData.growthStage}
                  onChange={(e) =>
                    setFormData({ ...formData, growthStage: e.target.value })
                  }
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Any stage (optional)</option>
                  {GROWTH_STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label} - {stage.description}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-stone-500">
                  Company maturity stage
                </p>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Financial Information
            </h2>

            <div className="space-y-3">
              {/* Currency */}
              <div>
                <label
                  htmlFor="currency"
                  className="mb-1 block text-xs font-medium text-stone-700"
                >
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              {/* Revenue and Cash Balance */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="totalRevenue"
                    className="mb-1 block text-xs font-medium text-stone-700"
                  >
                    Annual Revenue
                  </label>
                  <input
                    type="number"
                    id="totalRevenue"
                    value={formData.totalRevenue}
                    onChange={(e) =>
                      setFormData({ ...formData, totalRevenue: e.target.value })
                    }
                    className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="5000000"
                  />
                  <p className="mt-1 text-[10px] text-stone-500">
                    Unlocks revenue-per-FTE and efficiency metrics
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="currentCashBalance"
                    className="mb-1 block text-xs font-medium text-stone-700"
                  >
                    Current Cash Balance
                  </label>
                  <input
                    type="number"
                    id="currentCashBalance"
                    value={formData.currentCashBalance}
                    onChange={(e) =>
                      setFormData({ ...formData, currentCashBalance: e.target.value })
                    }
                    className="w-full rounded-md border border-stone-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="2000000"
                  />
                  <p className="mt-1 text-[10px] text-stone-500">
                    Track your runway and burn rate
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-xs text-stone-600 hover:text-stone-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.industry}
              className="rounded-md bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
