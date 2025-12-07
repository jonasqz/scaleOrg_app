'use client';

import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';

interface SettingsGeneralTabProps {
  datasetId: string;
  dataset: any;
}

export default function SettingsGeneralTab({ datasetId, dataset }: SettingsGeneralTabProps) {
  const [formData, setFormData] = useState({
    name: dataset.name || '',
    description: dataset.description || '',
    companyName: dataset.companyName || '',
    totalRevenue: dataset.totalRevenue ? Number(dataset.totalRevenue) : '',
    currentCashBalance: dataset.currentCashBalance ? Number(dataset.currentCashBalance) : '',
    fiscalYearStart: dataset.fiscalYearStart
      ? new Date(dataset.fiscalYearStart).toISOString().split('T')[0]
      : '',
    currency: dataset.currency || 'EUR',
    // Benchmarking settings
    industry: dataset.settings?.industry || '',
    region: dataset.settings?.region || '',
    growthStage: dataset.settings?.growthStage || '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Update dataset basic info
      const datasetRes = await fetch(`/api/datasets/${datasetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          companyName: formData.companyName || null,
          totalRevenue: formData.totalRevenue ? Number(formData.totalRevenue) : null,
          fiscalYearStart: formData.fiscalYearStart || null,
          currency: formData.currency,
        }),
      });

      if (!datasetRes.ok) {
        throw new Error('Failed to save dataset settings');
      }

      // Update cash balance separately (uses PUT endpoint)
      if (formData.currentCashBalance !== (dataset.currentCashBalance ? Number(dataset.currentCashBalance) : '')) {
        const cashBalanceRes = await fetch(`/api/datasets/${datasetId}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentCashBalance: formData.currentCashBalance ? Number(formData.currentCashBalance) : null,
          }),
        });

        if (!cashBalanceRes.ok) {
          throw new Error('Failed to save cash balance');
        }
      }

      // Update dataset settings (benchmarking)
      const settingsRes = await fetch(`/api/datasets/${datasetId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: formData.industry || null,
          region: formData.region || null,
          growthStage: formData.growthStage || null,
        }),
      });

      if (!settingsRes.ok) {
        throw new Error('Failed to save benchmarking settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
      // Refresh the page to update sidebar and other components
      window.location.reload();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-900'
              : 'bg-red-50 text-red-900'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Basic Information */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h3>

        <div className="space-y-4">
          {/* Dataset Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Dataset Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Q4 2024 Workforce Data"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Optional description of this dataset"
            />
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Company Information</h3>

        <div className="space-y-4">
          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Acme Corp"
            />
          </div>

          {/* Financial Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="totalRevenue" className="block text-sm font-medium text-gray-700">
                Annual Revenue
              </label>
              <input
                type="number"
                id="totalRevenue"
                name="totalRevenue"
                value={formData.totalRevenue}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="10000000"
              />
              <p className="mt-1 text-xs text-gray-500">
                Used for revenue per FTE calculations
              </p>
            </div>

            <div>
              <label htmlFor="currentCashBalance" className="block text-sm font-medium text-gray-700">
                Current Cash Balance
              </label>
              <input
                type="number"
                id="currentCashBalance"
                name="currentCashBalance"
                value={formData.currentCashBalance}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="500000"
              />
              <p className="mt-1 text-xs text-gray-500">
                Used for runway calculations in Compensation Tracking
              </p>
            </div>
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF (Fr)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              All monetary values will be displayed in this currency
            </p>
          </div>

          {/* Fiscal Year Start */}
          <div>
            <label htmlFor="fiscalYearStart" className="block text-sm font-medium text-gray-700">
              Fiscal Year Start Date
            </label>
            <input
              type="date"
              id="fiscalYearStart"
              name="fiscalYearStart"
              value={formData.fiscalYearStart}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional: Used for fiscal year reporting and projections
            </p>
          </div>
        </div>
      </div>

      {/* Benchmarking Settings */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Benchmarking Settings</h3>
        <p className="mb-4 text-sm text-gray-600">
          Configure these settings to get more accurate benchmark comparisons for your organization.
          These are optional - if not set, we'll use your account-level settings.
        </p>

        <div className="space-y-4">
          {/* Industry, Region, Growth Stage in a grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                Industry
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Use account default</option>
                <option value="SaaS">SaaS</option>
                <option value="Fintech">Fintech</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Climate Tech">Climate Tech</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Enterprise Software">Enterprise Software</option>
                <option value="Consumer">Consumer</option>
                <option value="B2B">B2B</option>
                <option value="Marketplace">Marketplace</option>
                <option value="Other">Other</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Industry vertical for benchmarking
              </p>
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                Region
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Global (default)</option>
                <option value="DACH">DACH (Germany, Austria, Switzerland)</option>
                <option value="EU">European Union</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="APAC">Asia-Pacific</option>
                <option value="LATAM">Latin America</option>
                <option value="MEA">Middle East & Africa</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Geographic region for comparison
              </p>
            </div>

            <div>
              <label htmlFor="growthStage" className="block text-sm font-medium text-gray-700">
                Growth Stage
              </label>
              <select
                id="growthStage"
                name="growthStage"
                value={formData.growthStage}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Any stage</option>
                <option value="Seed">Seed</option>
                <option value="Series A">Series A</option>
                <option value="Series B">Series B</option>
                <option value="Series B+">Series B+</option>
                <option value="Growth">Growth</option>
                <option value="Public">Public</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Company maturity stage
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border bg-blue-50 p-6">
        <h4 className="font-medium text-blue-900">About These Settings</h4>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>• <strong>Dataset Name:</strong> Helps you identify this dataset in your dashboard</li>
          <li>• <strong>Annual Revenue:</strong> Enables revenue per FTE and productivity metrics</li>
          <li>• <strong>Current Cash Balance:</strong> Used to calculate runway (months until cash runs out) in Compensation Tracking</li>
          <li>• <strong>Currency:</strong> All monetary values will be displayed in this currency</li>
          <li>• <strong>Fiscal Year:</strong> Used for year-over-year comparisons and projections</li>
          <li>• <strong>Benchmarking:</strong> Configure industry, region, and growth stage for more accurate benchmark comparisons in analytics</li>
        </ul>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save General Settings
            </>
          )}
        </button>
      </div>
    </form>
  );
}
