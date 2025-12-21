'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, BarChart3, DollarSign, Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode') || 'unknown';
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDatasetId(sessionStorage.getItem('onboardingDatasetId'));
      setIndustry(sessionStorage.getItem('onboardingIndustry'));
      setStage(sessionStorage.getItem('onboardingStage'));
    }
  }, []);

  useEffect(() => {
    if (datasetId && !markingComplete) {
      markOnboardingComplete();
    }
  }, [datasetId]);

  const markOnboardingComplete = async () => {
    setMarkingComplete(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('onboardingDatasetId');
        sessionStorage.removeItem('onboardingIndustry');
        sessionStorage.removeItem('onboardingStage');
      }
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    } finally {
      setMarkingComplete(false);
    }
  };

  const getMessage = () => {
    switch (mode) {
      case 'demo':
        return {
          title: "Your demo company is ready! 🎉",
          description: "We've created realistic employees based on your industry and stage. Explore the platform and replace with real data anytime.",
        };
      case 'csv':
        return {
          title: "Employees imported successfully! 🎉",
          description: "Your team data has been processed. You can now view analytics and insights.",
        };
      case 'manual':
        return {
          title: "Great start! 🎉",
          description: "You can add more employees anytime from your dashboard.",
        };
      case 'skip':
        return {
          title: "Company created! 🎉",
          description: "Add employees to unlock analytics and insights.",
        };
      default:
        return {
          title: "You're all set! 🎉",
          description: "Your company is ready to go.",
        };
    }
  };

  const message = getMessage();
  const formattedIndustry = industry?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const formattedStage = stage?.replace(/_/g, ' ');

  if (!datasetId) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-stone-50 to-blue-50">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-stone-900 mb-3">{message.title}</h1>
          <p className="text-sm text-stone-600 max-w-xl mx-auto">{message.description}</p>

          {mode === 'demo' && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-purple-50 border border-purple-200 px-4 py-2">
              <span className="text-xs font-medium text-purple-700">Demo Data Active</span>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-stone-900 mb-4 text-center">
            Recommended Next Steps
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href={`/dashboard/datasets/${datasetId}/analytics/overview`}
              className="group rounded-lg border border-stone-200 bg-white p-5 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-blue-100 p-2.5">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 mb-1">View Analytics</h3>
              <p className="text-xs text-stone-600">
                {formattedIndustry && formattedStage
                  ? `See ${formattedIndustry} ${formattedStage} benchmarks`
                  : 'Explore your workforce metrics'}
              </p>
            </Link>

            <Link
              href={`/dashboard/datasets/${datasetId}/compensation`}
              className="group rounded-lg border border-stone-200 bg-white p-5 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-green-100 p-2.5">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 mb-1">
                Compensation Planning
              </h3>
              <p className="text-xs text-stone-600">Track and plan compensation budgets</p>
            </Link>

            <Link
              href={`/dashboard/datasets/${datasetId}/cash-flow`}
              className="group rounded-lg border border-stone-200 bg-white p-5 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-purple-100 p-2.5">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 mb-1">Cash Flow & Runway</h3>
              <p className="text-xs text-stone-600">Monitor your financial runway</p>
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href={`/dashboard/datasets/${datasetId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-8 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>

          {mode === 'demo' && (
            <p className="mt-4 text-xs text-stone-500">
              You can delete or replace demo data from Settings
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
