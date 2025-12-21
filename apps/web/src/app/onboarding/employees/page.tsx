'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Sparkles, UserPlus, ArrowRight } from 'lucide-react';
import OnboardingProgress from '@/components/onboarding-progress';

export default function EmployeesImportPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const datasetId = typeof window !== 'undefined'
    ? sessionStorage.getItem('onboardingDatasetId')
    : null;
  const industry = typeof window !== 'undefined'
    ? sessionStorage.getItem('onboardingIndustry')
    : null;
  const growthStage = typeof window !== 'undefined'
    ? sessionStorage.getItem('onboardingGrowthStage')
    : null;

  const handleDemoData = async () => {
    if (!datasetId || !industry) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/datasets/${datasetId}/demo-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, growthStage }),
      });

      if (!response.ok) throw new Error('Failed to generate demo data');

      router.push('/onboarding/complete?mode=demo');
    } catch (error) {
      console.error('Error generating demo data:', error);
      alert('Failed to generate demo data');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/complete?mode=skip');
  };

  const handleCSV = () => {
    // Redirect to employees page with CSV upload
    router.push(`/dashboard/datasets/${datasetId}/employees?openCSV=true&onboarding=true`);
  };

  const handleManual = () => {
    // Redirect to employees page to add manually
    router.push(`/dashboard/datasets/${datasetId}/employees?onboarding=true`);
  };

  if (!datasetId) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-stone-600">Session expired. Please start over.</p>
          <button
            onClick={() => router.push('/onboarding/company')}
            className="mt-4 text-sm text-orange-600 hover:text-orange-700"
          >
            Go back to company setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Progress */}
        <div className="mb-12">
          <OnboardingProgress currentStep={3} />
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-stone-900 mb-3">Add Your Employees</h2>
          <p className="text-sm text-stone-600">
            Choose how you want to add your team members
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Option 1: Upload CSV */}
          <button
            onClick={() => setSelectedOption('csv')}
            className={`rounded-lg border-2 p-6 text-left transition-all hover:border-orange-300 hover:shadow-md ${
              selectedOption === 'csv'
                ? 'border-orange-600 bg-orange-50'
                : 'border-stone-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-blue-100 p-3">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-stone-900">Upload CSV</h3>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-stone-600 mb-2">
                  Fastest for teams with 10+ employees
                </p>
                <p className="text-[11px] text-stone-500">
                  Import your employee data from a CSV file. We'll help you map the columns.
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Demo Data */}
          <button
            onClick={() => setSelectedOption('demo')}
            className={`rounded-lg border-2 p-6 text-left transition-all hover:border-orange-300 hover:shadow-md ${
              selectedOption === 'demo'
                ? 'border-orange-600 bg-orange-50'
                : 'border-stone-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-purple-100 p-3">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-stone-900">Use Demo Data</h3>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                    Explore First
                  </span>
                </div>
                <p className="text-xs text-stone-600 mb-2">
                  See the platform with realistic sample data
                </p>
                <p className="text-[11px] text-stone-500">
                  We'll create {industry && growthStage ? 'realistic ' : ''}employees based on your industry and stage. You can replace this data anytime.
                </p>
              </div>
            </div>
          </button>

          {/* Option 3: Add Manually */}
          <button
            onClick={() => setSelectedOption('manual')}
            className={`rounded-lg border-2 p-6 text-left transition-all hover:border-orange-300 hover:shadow-md ${
              selectedOption === 'manual'
                ? 'border-orange-600 bg-orange-50'
                : 'border-stone-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-green-100 p-3">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-stone-900 mb-1">Add Manually</h3>
                <p className="text-xs text-stone-600 mb-2">
                  Perfect for small teams (1-10 employees)
                </p>
                <p className="text-[11px] text-stone-500">
                  Add employees one by one using our simple form.
                </p>
              </div>
            </div>
          </button>

          {/* Option 4: Skip */}
          <button
            onClick={() => setSelectedOption('skip')}
            className={`rounded-lg border-2 p-6 text-left transition-all hover:border-orange-300 hover:shadow-md ${
              selectedOption === 'skip'
                ? 'border-orange-600 bg-orange-50'
                : 'border-stone-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-stone-100 p-3">
                <ArrowRight className="h-6 w-6 text-stone-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-stone-900 mb-1">Skip for Now</h3>
                <p className="text-xs text-stone-600 mb-2">
                  Add employees later from your dashboard
                </p>
                <p className="text-[11px] text-stone-500">
                  You can always add employees later. Analytics will unlock once you have data.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Action Button */}
        {selectedOption && (
          <div className="text-center">
            <button
              onClick={() => {
                if (selectedOption === 'csv') handleCSV();
                else if (selectedOption === 'demo') handleDemoData();
                else if (selectedOption === 'manual') handleManual();
                else if (selectedOption === 'skip') handleSkip();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-8 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}

        <p className="mt-6 text-xs text-center text-stone-500">
          Step 3 of 3 • Almost done!
        </p>
      </div>
    </div>
  );
}
