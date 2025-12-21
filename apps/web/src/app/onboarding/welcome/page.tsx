import Link from 'next/link';
import { BarChart3, Target, TrendingUp, Wallet } from 'lucide-react';
import OnboardingProgress from '@/components/onboarding-progress';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-stone-50 to-blue-50">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Progress */}
        <div className="mb-12">
          <OnboardingProgress currentStep={1} />
        </div>

        {/* Main content */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600 mb-6">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-stone-900 mb-4">
            See how your company performs
          </h1>

          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Get workforce insights, benchmark against your industry, and plan your runway in under 2 minutes
          </p>
        </div>

        {/* Value props */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="rounded-lg border border-stone-200 bg-white p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-2">
              Instant Analytics
            </h3>
            <p className="text-xs text-stone-600">
              60+ workforce metrics across 6 key dimensions - from cost efficiency to team structure
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-2">
              Industry Benchmarks
            </h3>
            <p className="text-xs text-stone-600">
              Compare your org against companies at your stage and industry
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-4">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 mb-2">
              Cash Flow & Scenarios
            </h3>
            <p className="text-xs text-stone-600">
              Track runway, model hiring plans, and plan compensation budgets
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/onboarding/company"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-8 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
          >
            Analyze My Company
          </Link>
          <p className="mt-3 text-xs text-stone-500">
            Takes less than 2 minutes to set up
          </p>
        </div>
      </div>
    </div>
  );
}
