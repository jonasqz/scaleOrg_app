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
      settings: true,
    },
  });

  if (!dataset) {
    notFound();
  }

  // Get department categories from settings
  const departmentCategories = dataset.settings?.departmentCategories as Record<string, string> | undefined;

  const metrics =
    dataset.employees.length > 0
      ? calculateAllMetrics(dataset.employees, dataset, departmentCategories)
      : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">Scenarios</h1>
        <p className="mt-1 text-xs text-stone-500">
          Run what-if analyses to understand the impact of workforce changes
        </p>
      </div>

      {/* Content */}
      {metrics ? (
        <>
          {/* Info Banner */}
          <div className="flex items-start justify-between gap-4">
            <div className="rounded-lg border border-stone-200 bg-orange-50 p-4 flex-1">
              <h2 className="mb-2 text-sm font-semibold text-orange-900">
                Scenario Modeling
              </h2>
              <p className="text-xs text-orange-700">
                Run what-if analyses to understand the impact of workforce changes on your
                metrics. Model hiring freezes, cost reductions, growth plans, and more.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/datasets/${dataset.id}/scenarios/compare`}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50 whitespace-nowrap transition-colors"
              >
                <Scale className="h-4 w-4" />
                Compare Scenarios
              </Link>
              <Link
                href={`/dashboard/datasets/${dataset.id}/scenarios/new`}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 whitespace-nowrap transition-colors"
              >
                <Plus className="h-4 w-4" />
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
        <div className="rounded-lg border border-stone-200 bg-yellow-50 p-5 text-center">
          <GitCompare className="mx-auto h-5 w-5 text-yellow-600" />
          <p className="mt-3 text-xs font-medium text-yellow-900">
            No data available for scenarios
          </p>
          <p className="mt-1 text-[10px] text-yellow-700">
            Add employees first to run scenario analyses
          </p>
          <Link
            href={`/dashboard/datasets/${dataset.id}/employees`}
            className="mt-3 inline-block rounded-lg bg-yellow-600 px-4 py-2 text-xs font-medium text-white hover:bg-yellow-700 transition-colors"
          >
            Go to Employees
          </Link>
        </div>
      )}
    </div>
  );
}
