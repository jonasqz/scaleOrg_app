'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewDatasetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyName: '',
    totalRevenue: '',
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
          ...formData,
          totalRevenue: formData.totalRevenue
            ? parseFloat(formData.totalRevenue)
            : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create dataset');

      const { dataset } = await response.json();
      router.push(`/dashboard/datasets/${dataset.id}`);
    } catch (error) {
      console.error('Error creating dataset:', error);
      alert('Failed to create dataset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Create New Dataset
          </h1>
          <p className="text-gray-600">
            Set up a new workforce dataset to analyze
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Dataset Information
            </h2>

            <div className="space-y-4">
              {/* Dataset Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Dataset Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Q4 2024 Workforce"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-1 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Optional description..."
                />
              </div>

              {/* Company Name */}
              <div>
                <label
                  htmlFor="companyName"
                  className="mb-1 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Acme Corp"
                />
              </div>

              {/* Revenue and Currency */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="totalRevenue"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Annual Revenue (optional)
                  </label>
                  <input
                    type="number"
                    id="totalRevenue"
                    value={formData.totalRevenue}
                    onChange={(e) =>
                      setFormData({ ...formData, totalRevenue: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="50000000"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Used to calculate revenue per FTE
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="currency"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Dataset'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
