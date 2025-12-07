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
    fiscalYearStart: dataset.fiscalYearStart
      ? new Date(dataset.fiscalYearStart).toISOString().split('T')[0]
      : '',
    currency: dataset.currency || 'EUR',
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
      const res = await fetch(`/api/datasets/${datasetId}`, {
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

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
        // Refresh the page to update sidebar and other components
        window.location.reload();
      } else {
        throw new Error('Failed to save settings');
      }
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

          {/* Total Revenue and Currency */}
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
            </div>
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

      {/* Info Banner */}
      <div className="rounded-lg border bg-blue-50 p-6">
        <h4 className="font-medium text-blue-900">About These Settings</h4>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>• <strong>Dataset Name:</strong> Helps you identify this dataset in your dashboard</li>
          <li>• <strong>Annual Revenue:</strong> Enables revenue per FTE and productivity metrics</li>
          <li>• <strong>Currency:</strong> All monetary values will be displayed in this currency</li>
          <li>• <strong>Fiscal Year:</strong> Used for year-over-year comparisons and projections</li>
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
