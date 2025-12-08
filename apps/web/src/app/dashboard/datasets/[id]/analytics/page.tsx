import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@scleorg/database';
import { calculateAllMetrics } from '@scleorg/calculations';
import AnalyticsTabs from '../analytics-tabs';
import { AnalyticsHeader } from '../analytics-header';

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

  // Note: Benchmark summary will be fetched in the client component export modal
  // to keep the server component fast
  return (
    <div className="space-y-8">
      {/* Page Header with Export Button */}
      <AnalyticsHeader
        dataset={dataset}
        employees={dataset.employees}
        metrics={metrics}
      />

      {/* Analytics Sub-Tabs */}
      <AnalyticsTabs
        datasetId={dataset.id}
        currency={dataset.currency}
        employees={dataset.employees}
        metrics={metrics}
        dataset={dataset}
        departmentCategories={departmentCategories}
      />
    </div>
  );
}
