import Link from 'next/link';
import { ArrowRight, BarChart3, Zap, Shield } from 'lucide-react';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">scleorg</div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-gray-600 hover:text-gray-900">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold text-gray-900">
          Strategic Workforce Benchmarking
          <br />
          <span className="text-blue-600">in 60 Seconds</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
          AI-powered platform that gives CFOs and CHROs instant clarity about
          workforce structure, efficiency, and cost optimization opportunities.
        </p>
        <SignedOut>
          <SignUpButton mode="modal">
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700">
              Start Free Analysis
              <ArrowRight className="h-5 w-5" />
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700"
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
        </SignedIn>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <Zap className="mb-4 h-12 w-12 text-blue-600" />
            <h3 className="mb-2 text-xl font-semibold">Instant Insights</h3>
            <p className="text-gray-600">
              Upload your Excel file and get comprehensive workforce analytics
              in under 60 seconds. No integration required.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <BarChart3 className="mb-4 h-12 w-12 text-blue-600" />
            <h3 className="mb-2 text-xl font-semibold">
              Benchmark Comparisons
            </h3>
            <p className="text-gray-600">
              Compare your organization against industry standards. See exactly
              where you stand on R&D:GTM ratios, cost efficiency, and more.
            </p>
          </div>

          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <Shield className="mb-4 h-12 w-12 text-blue-600" />
            <h3 className="mb-2 text-xl font-semibold">Scenario Planning</h3>
            <p className="text-gray-600">
              Model hiring freezes, cost reductions, or growth scenarios in
              real-time. Make data-driven workforce decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 scleorg. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
