import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@scleorg/database';
import { calculateAllMetrics } from '@scleorg/calculations';
import { Users, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default async function DatasetOverviewPage({
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
        {dataset.description && (
          <p className="mt-2 text-gray-600">{dataset.description}</p>
        )}
        {dataset.companyName && (
          <p className="mt-1 text-sm text-gray-500">{dataset.companyName}</p>
        )}
      </div>

      {/* Key Metrics */}
      {metrics ? (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900">
              {metrics.summary.totalFTE.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600">Total FTE</p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900">
              {dataset.currency} {(metrics.summary.totalCost / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-gray-600">Total Cost</p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900">
              {metrics.ratios.rdToGTM.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">R&D:GTM Ratio</p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900">
              {metrics.ratios.avgSpanOfControl.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600">Avg Span of Control</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-yellow-50 p-8 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-yellow-600" />
          <p className="mt-4 font-medium text-yellow-900">No data yet</p>
          <p className="mt-1 text-sm text-yellow-700">
            Add employees to see metrics and analytics
          </p>
          <Link
            href={`/dashboard/datasets/${dataset.id}/employees`}
            className="mt-4 inline-block rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
          >
            Go to Employees
          </Link>
        </div>
      )}

      {/* Department Breakdown */}
      {metrics && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Department Breakdown
          </h2>
          <div className="space-y-3">
            {Object.entries(metrics.departments).map(([dept, data]: [string, any]) => (
              <div
                key={dept}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{dept}</p>
                  <p className="text-sm text-gray-600">
                    {data.fte.toFixed(1)} FTE · {data.employeeCount} employees
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {dataset.currency} {(data.cost / 1000).toFixed(0)}k
                  </p>
                  <p className="text-sm text-gray-600">
                    {data.percentage.toFixed(1)}% of total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-lg border bg-blue-50 p-6">
        <h3 className="mb-2 text-sm font-semibold text-blue-900">Quick Actions</h3>
        <p className="mb-4 text-sm text-blue-700">
          Navigate to different sections using the sidebar
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/datasets/${dataset.id}/employees`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Manage Employees
          </Link>
          <Link
            href={`/dashboard/datasets/${dataset.id}/analytics`}
            className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            View Analytics
          </Link>
          <Link
            href={`/dashboard/datasets/${dataset.id}/scenarios`}
            className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Run Scenarios
          </Link>
        </div>
      </div>
    </div>
  );
}
