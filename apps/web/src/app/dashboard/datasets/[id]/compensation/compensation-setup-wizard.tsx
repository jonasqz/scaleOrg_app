'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Check } from 'lucide-react';

interface CompensationSetupWizardProps {
  datasetId: string;
  currency: string;
  onComplete: () => void;
}

export default function CompensationSetupWizard({
  datasetId,
  currency,
  onComplete,
}: CompensationSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [employerCostRatio, setEmployerCostRatio] = useState('1.35');
  const [cashBalance, setCashBalance] = useState('');
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Save cash balance to dataset settings
      if (cashBalance) {
        await fetch(`/api/datasets/${datasetId}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentCashBalance: parseFloat(cashBalance),
          }),
        });
      }

      // The employer cost ratio will be used automatically by the system
      // when there's no historical data to calculate from

      onComplete();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div className={`h-1 w-20 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > 2 ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <div className={`h-1 w-20 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-lg border bg-white p-8 shadow-lg">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome to Compensation Tracking</h2>
                <p className="mt-2 text-gray-600">
                  Let's set up your compensation planning in just a few steps
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="font-semibold text-blue-900">What you'll get:</h3>
                <ul className="mt-2 space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Automatic planned compensation calculations from your employee data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Planned vs actual variance analysis with color-coded insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Monthly burn rate tracking and runway calculations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>24-month view (12 past + 12 future) with inline editing</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Employer Cost Ratio</h2>
                <p className="mt-2 text-gray-600">
                  How much do employer costs add on top of gross compensation?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employer Cost Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="3"
                    value={employerCostRatio}
                    onChange={(e) => setEmployerCostRatio(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1.35"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Default is 1.35 (35% overhead). This includes employer taxes, social contributions, health insurance, and benefits.
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
                  <p className="font-semibold text-gray-900">Common multipliers:</p>
                  <ul className="space-y-1 text-gray-700">
                    <li><strong>1.2-1.3</strong> - Low overhead (minimal benefits, contract workers)</li>
                    <li><strong>1.35-1.45</strong> - Standard (typical employer taxes + basic benefits)</li>
                    <li><strong>1.5-1.7</strong> - High overhead (comprehensive benefits, equity, bonuses)</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> If you have historical payroll data, the system will automatically calculate your actual ratio. This is just the starting point for planned compensation.
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Current Cash Balance</h2>
                <p className="mt-2 text-gray-600">
                  How much cash do you have available? (For runway calculations)
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cash Balance ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashBalance}
                    onChange={(e) => setCashBalance(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="500000"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Enter your current available cash balance. This will be used to calculate runway (months until cash runs out).
                  </p>
                </div>

                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <p className="text-sm text-yellow-900">
                    <strong>Optional:</strong> You can skip this for now and set it later in Dataset Settings. Runway calculations will show "N/A" until you provide a cash balance.
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
