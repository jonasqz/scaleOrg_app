import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@scleorg/database';
import { calculateAllMetrics } from '@scleorg/calculations';
import { Users, TrendingUp, BarChart3, DollarSign, AlertTriangle, TrendingDown, Calendar, Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function DatasetOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const { id } = await params;

  const dataset = await prisma.dataset.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      employees: {
        where: { endDate: null }, // Only active employees
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

  // Fetch cash flow summary
  let cashFlowSummary = null;
  try {
    const cashFlowResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/datasets/${id}/cash-flow`, {
      cache: 'no-store',
    });
    if (cashFlowResponse.ok) {
      const cashFlowData = await cashFlowResponse.json();
      cashFlowSummary = cashFlowData.summary;
    }
  } catch (error) {
    console.error('Failed to fetch cash flow summary:', error);
  }

  // Fetch compensation variance
  let compensationAlert = null;
  try {
    const compResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/datasets/${id}/compensation/planning`, {
      cache: 'no-store',
    });
    if (compResponse.ok) {
      const compData = await compResponse.json();
      const avgVariance = compData.summary?.avgVariancePercent;
      if (avgVariance && Math.abs(avgVariance) > 5) {
        compensationAlert = {
          type: avgVariance > 0 ? 'over' : 'under',
          percent: Math.abs(avgVariance),
        };
      }
    }
  } catch (error) {
    console.error('Failed to fetch compensation data:', error);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">{dataset.name}</h1>
        {dataset.description && (
          <p className="mt-1 text-xs text-stone-500">{dataset.description}</p>
        )}
        {dataset.companyName && (
          <p className="mt-0.5 text-xs text-stone-400">{dataset.companyName}</p>
        )}
      </div>

      {/* Alerts Section */}
      {(compensationAlert || (cashFlowSummary?.runway && cashFlowSummary.runway < 6)) && (
        <div className="space-y-2">
          {compensationAlert && (
            <div className={`rounded-lg border p-3 ${
              compensationAlert.type === 'over'
                ? 'border-red-200 bg-red-50'
                : 'border-green-200 bg-green-50'
            }`}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${
                  compensationAlert.type === 'over' ? 'text-red-600' : 'text-green-600'
                }`} />
                <div className="flex-1">
                  <h3 className={`text-xs font-semibold ${
                    compensationAlert.type === 'over' ? 'text-red-900' : 'text-green-900'
                  }`}>
                    Compensation {compensationAlert.type === 'over' ? 'Over' : 'Under'} Budget
                  </h3>
                  <p className={`mt-0.5 text-[11px] ${
                    compensationAlert.type === 'over' ? 'text-red-700' : 'text-green-700'
                  }`}>
                    Your actual compensation is averaging {compensationAlert.percent.toFixed(1)}%{' '}
                    {compensationAlert.type === 'over' ? 'over' : 'under'} planned budget.
                  </p>
                  <Link
                    href={`/dashboard/datasets/${dataset.id}/compensation`}
                    className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium ${
                      compensationAlert.type === 'over' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    View Details <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {cashFlowSummary?.runway && cashFlowSummary.runway < 6 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-orange-600" />
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-orange-900">Low Cash Runway</h3>
                  <p className="mt-0.5 text-[11px] text-orange-700">
                    You have approximately {cashFlowSummary.runway.toFixed(1)} months of runway remaining
                    {cashFlowSummary.runwayDate && ` (until ${cashFlowSummary.runwayDate})`}.
                  </p>
                  <div className="mt-1.5 flex gap-2">
                    <Link
                      href={`/dashboard/datasets/${dataset.id}/cash-flow`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700"
                    >
                      Update Projections <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Link
                      href={`/dashboard/datasets/${dataset.id}/scenarios`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700"
                    >
                      Run Scenarios <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      {metrics ? (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-stone-900">
              {metrics.summary.totalFTE.toFixed(1)}
            </p>
            <p className="text-[11px] font-medium text-stone-500">Total FTE</p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-stone-900">
              {dataset.currency}{(metrics.summary.totalCost / 1000000).toFixed(1)}M
            </p>
            <p className="text-[11px] font-medium text-stone-500">Total Cost</p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-stone-900">
              {metrics.ratios.rdToGTM.toFixed(2)}
            </p>
            <p className="text-[11px] font-medium text-stone-500">R&D:GTM Ratio</p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-stone-900">
              {metrics.ratios.avgSpanOfControl.toFixed(1)}
            </p>
            <p className="text-[11px] font-medium text-stone-500">Avg Span of Control</p>
          </div>
        </div>
      ) : null}

      {/* Cash Flow Summary */}
      {cashFlowSummary && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <Wallet className="h-5 w-5 text-green-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-stone-900">
              {dataset.currency}{(cashFlowSummary.currentCash / 1000000).toFixed(1)}M
            </p>
            <p className="text-[11px] font-medium text-stone-500">Current Cash</p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-stone-900">
              {dataset.currency}{(cashFlowSummary.avgMonthlyBurn / 1000).toFixed(0)}k
            </p>
            <p className="text-[11px] font-medium text-stone-500">Monthly Burn</p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <Calendar className={`h-5 w-5 ${
                cashFlowSummary.runway && cashFlowSummary.runway < 6 ? 'text-orange-600' : 'text-purple-600'
              }`} />
            </div>
            <p className={`mt-3 text-2xl font-bold ${
              cashFlowSummary.runway && cashFlowSummary.runway < 6 ? 'text-orange-600' : 'text-stone-900'
            }`}>
              {cashFlowSummary.runway !== null ? `${cashFlowSummary.runway.toFixed(1)} mo` : 'N/A'}
            </p>
            <p className="text-[11px] font-medium text-stone-500">Cash Runway</p>
          </div>
        </div>
      )}

      {/* Department Breakdown */}
      {metrics && (
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-stone-900">
            Department Breakdown
          </h2>
          <div className="space-y-2">
            {Object.entries(metrics.departments).map(([dept, data]: [string, any]) => (
              <div
                key={dept}
                className="flex items-center justify-between rounded-md bg-stone-50 p-3"
              >
                <div>
                  <p className="text-xs font-medium text-stone-900">{dept}</p>
                  <p className="text-[11px] text-stone-500">
                    {data.fte.toFixed(1)} FTE · {data.employeeCount} employees
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-stone-900">
                    {dataset.currency} {(data.cost / 1000).toFixed(0)}k
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {data.percentage.toFixed(1)}% of total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
          <h3 className="mb-1 text-sm font-semibold text-blue-900">Workforce Management</h3>
          <p className="mb-3 text-[11px] text-blue-700">
            Manage your team and track compensation
          </p>
          <div className="flex flex-col gap-1.5">
            <Link
              href={`/dashboard/datasets/${dataset.id}/employees`}
              className="inline-flex items-center justify-between rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <span>Manage Employees</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/dashboard/datasets/${dataset.id}/compensation`}
              className="inline-flex items-center justify-between rounded-md border border-blue-600 bg-white px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <span>Compensation Tracking</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
          <h3 className="mb-1 text-sm font-semibold text-orange-900">Financial Planning</h3>
          <p className="mb-3 text-[11px] text-orange-700">
            Track cash flow and model scenarios
          </p>
          <div className="flex flex-col gap-1.5">
            <Link
              href={`/dashboard/datasets/${dataset.id}/cash-flow`}
              className="inline-flex items-center justify-between rounded-md bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
            >
              <span>Cash Flow & Runway</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/dashboard/datasets/${dataset.id}/scenarios`}
              className="inline-flex items-center justify-between rounded-md border border-orange-600 bg-white px-3 py-2 text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <span>Scenario Planning</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Getting Started Guide (if no employees) */}
      {!metrics && (
        <div className="rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 p-6">
          <h3 className="text-sm font-semibold text-blue-900">Welcome to SCLE!</h3>
          <p className="mt-1 text-[11px] text-blue-700">
            Get started by adding your team members, then track compensation and plan your financial runway.
          </p>
          <div className="mt-4 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">1</div>
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-900">Add Employees</p>
                <p className="text-[11px] text-blue-700">Upload CSV or add manually</p>
                <Link
                  href={`/dashboard/datasets/${dataset.id}/employees`}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Go to Employees <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">2</div>
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-900">Set Cash Balance</p>
                <p className="text-[11px] text-blue-700">Configure your current cash for runway tracking</p>
                <Link
                  href={`/dashboard/datasets/${dataset.id}/settings`}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Go to Settings <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">3</div>
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-900">Track & Plan</p>
                <p className="text-[11px] text-blue-700">View compensation tracking and model scenarios</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
