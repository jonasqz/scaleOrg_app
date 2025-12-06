import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@scleorg/database';
import { calculateAllMetrics } from '@scleorg/calculations';
import { BarChart3, Download } from 'lucide-react';
import Link from 'next/link';
import MetricsCharts from '../metrics-charts';
import BenchmarkComparison from '../benchmark-comparison';
import OutliersDisplay from '../outliers-display';
import TenureDisplay from '../tenure-display';
import InsightsDisplay from '../insights-display';

export default async function AnalyticsPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const dataset = await prisma.dataset.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
    include: {
      employees: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!dataset) {
    notFound();
  }

  const metrics =
    dataset.employees.length > 0
      ? calculateAllMetrics(dataset.employees, dataset)
      : null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="mt-2 text-gray-600">
            Deep dive into your workforce metrics and trends
          </p>
        </div>

        {/* Export Button - Will be implemented later */}
        {metrics && dataset.employees.length >= 3 && (
          <button
            disabled
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-400 cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export PDF (Coming Soon)
          </button>
        )}
      </div>

      {/* Content */}
      {metrics && dataset.employees.length >= 3 ? (
        <div className="space-y-8">
          {/* Visualizations */}
          <MetricsCharts
            departments={metrics.departments}
            currency={dataset.currency}
          />

          {/* Benchmark Comparison */}
          <BenchmarkComparison
            datasetId={dataset.id}
            currency={dataset.currency}
          />

          {/* Outlier Detection */}
          {dataset.employees.length >= 5 && (
            <OutliersDisplay
              employees={dataset.employees}
              currency={dataset.currency}
            />
          )}

          {/* Tenure Analysis */}
          {metrics.tenure && (
            <TenureDisplay tenure={metrics.tenure} />
          )}

          {/* AI-Powered Insights */}
          <InsightsDisplay
            metrics={metrics}
            currency={dataset.currency}
          />
        </div>
      ) : (
        <div className="rounded-lg border bg-yellow-50 p-8 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-yellow-600" />
          <p className="mt-4 font-medium text-yellow-900">
            Need more data for analytics
          </p>
          <p className="mt-1 text-sm text-yellow-700">
            Add at least 3 employees to see analytics and insights
          </p>
          <Link
            href={`/dashboard/datasets/${dataset.id}/employees`}
            className="mt-4 inline-block rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
          >
            Go to Employees
          </Link>
        </div>
      )}
    </div>
  );
}
