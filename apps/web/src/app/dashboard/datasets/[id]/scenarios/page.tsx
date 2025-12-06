import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@scleorg/database';
import { calculateAllMetrics } from '@scleorg/calculations';
import { GitCompare, Plus, Scale } from 'lucide-react';
import Link from 'next/link';
import ScenarioBuilder from '../scenario-builder';
import SavedScenariosList from '../saved-scenarios-list';

export default async function ScenariosPage({
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Scenarios</h1>
        <p className="mt-2 text-gray-600">
          Run what-if analyses to understand the impact of workforce changes
        </p>
      </div>

      {/* Content */}
      {metrics ? (
        <>
          {/* Info Banner */}
          <div className="flex items-start justify-between gap-4">
            <div className="rounded-lg border bg-purple-50 p-6 flex-1">
              <h2 className="mb-2 text-lg font-semibold text-purple-900">
                Scenario Modeling
              </h2>
              <p className="text-sm text-purple-700">
                Run what-if analyses to understand the impact of workforce changes on your
                metrics. Model hiring freezes, cost reductions, growth plans, and more.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/datasets/${dataset.id}/scenarios/compare`}
                className="inline-flex items-center gap-2 rounded-lg border border-purple-600 bg-white px-6 py-3 font-semibold text-purple-600 hover:bg-purple-50 whitespace-nowrap"
              >
                <Scale className="h-5 w-5" />
                Compare Scenarios
              </Link>
              <Link
                href={`/dashboard/datasets/${dataset.id}/scenarios/new`}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 whitespace-nowrap"
              >
                <Plus className="h-5 w-5" />
                New Detailed Scenario
              </Link>
            </div>
          </div>

          {/* Scenario Builder */}
          <ScenarioBuilder
            datasetId={dataset.id}
            currency={dataset.currency}
            currentMetrics={{
              totalFTE: metrics.summary.totalFTE,
              totalCost: metrics.summary.totalCost,
              employeeCount: metrics.summary.employeeCount,
              rdToGTM: metrics.ratios.rdToGTM,
            }}
            departments={metrics.departments}
            employees={dataset.employees}
          />

          {/* Saved Scenarios */}
          <SavedScenariosList
            datasetId={dataset.id}
            currency={dataset.currency}
          />
        </>
      ) : (
        <div className="rounded-lg border bg-yellow-50 p-8 text-center">
          <GitCompare className="mx-auto h-12 w-12 text-yellow-600" />
          <p className="mt-4 font-medium text-yellow-900">
            No data available for scenarios
          </p>
          <p className="mt-1 text-sm text-yellow-700">
            Add employees first to run scenario analyses
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
