'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingProgress from '@/components/onboarding-progress';
import { INDUSTRIES, REGIONS, GROWTH_STAGES } from '@/lib/benchmarking-constants';

export default function CompanySetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    // Benchmarking settings (saved to DatasetSettings)
    industry: '',
    region: '',
    growthStage: '',
    // Dataset-level financial data
    currency: 'EUR',
    totalRevenue: '',
    currentCashBalance: '',
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
          currency: formData.currency,
          totalRevenue: formData.totalRevenue ? parseFloat(formData.totalRevenue) : null,
          currentCashBalance: formData.currentCashBalance
            ? parseFloat(formData.currentCashBalance)
            : null,
          fileName: 'onboarding',
          fileUrl: '',
          fileType: 'onboarding',
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

      // Store dataset ID and benchmarking info in session for next step
      sessionStorage.setItem('onboardingDatasetId', dataset.id);
      sessionStorage.setItem('onboardingIndustry', formData.industry);
      sessionStorage.setItem('onboardingGrowthStage', formData.growthStage);

      router.push('/onboarding/employees');
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Progress */}
        <div className="mb-12">
          <OnboardingProgress currentStep={2} />
        </div>

        {/* Form */}
        <div className="rounded-lg border border-stone-200 bg-white p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-stone-900">Company Setup</h2>
            <p className="mt-1 text-sm text-stone-600">
              Tell us about your company to get relevant benchmarks
            </p>
            <p className="mt-2 text-xs text-stone-500 border-l-2 border-orange-600 pl-3">
              We use industry + stage to show you relevant benchmarks from similar companies
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1.5">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="e.g., Acme Inc"
              />
            </div>

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-stone-700 mb-1.5">
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                id="industry"
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry.value} value={industry.value}>
                    {industry.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-stone-700 mb-1.5">
                Region
              </label>
              <select
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                {REGIONS.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-stone-500">Geographic region for benchmark comparisons</p>
            </div>

            {/* Company Growth Stage */}
            <div>
              <label htmlFor="growthStage" className="block text-sm font-medium text-stone-700 mb-1.5">
                Company Growth Stage
              </label>
              <select
                id="growthStage"
                value={formData.growthStage}
                onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="">Any stage (optional)</option>
                {GROWTH_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label} - {stage.description}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-stone-500">Company maturity for stage-specific benchmarks</p>
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-stone-700 mb-1.5">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            {/* Annual Revenue */}
            <div>
              <label htmlFor="totalRevenue" className="block text-sm font-medium text-stone-700 mb-1.5">
                Annual Revenue
              </label>
              <input
                type="number"
                id="totalRevenue"
                value={formData.totalRevenue}
                onChange={(e) => setFormData({ ...formData, totalRevenue: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="5000000"
              />
              <p className="mt-1 text-xs text-stone-500">
                Unlocks revenue-per-FTE and efficiency metrics
              </p>
            </div>

            {/* Current Cash Balance */}
            <div>
              <label htmlFor="currentCashBalance" className="block text-sm font-medium text-stone-700 mb-1.5">
                Current Cash Balance
              </label>
              <input
                type="number"
                id="currentCashBalance"
                value={formData.currentCashBalance}
                onChange={(e) =>
                  setFormData({ ...formData, currentCashBalance: e.target.value })
                }
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="2000000"
              />
              <p className="mt-1 text-xs text-stone-500">Track your runway and burn rate</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.industry}
              className="w-full rounded-md bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Next: Add Employees'}
            </button>

            <p className="text-xs text-center text-stone-500">
              Step 2 of 3 • All data is encrypted and private
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
