import { redirect } from 'next/navigation';
import { verifyDatasetAccess } from '@/lib/access-control';
import { prisma } from '@scleorg/database';
import { calculateAllMetrics } from '@scleorg/calculations';
import AnalyticsPayGapTab from '../../analytics-pay-gap-tab';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AnalyticsPayGapPage({ params }: PageProps) {
  const { id: datasetId } = await params;

  // Verify dataset access
  const dataset = await verifyDatasetAccess(datasetId);

  if (!dataset) {
    redirect('/dashboard');
  }

  // Fetch employees
  const fullDataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    include: {
      employees: {
        orderBy: { createdAt: 'desc' },
      },
      settings: true,
    },
  });

  if (!fullDataset) {
    redirect('/dashboard');
  }

  // Get department categories from settings
  const departmentCategories = fullDataset.settings?.departmentCategories as Record<string, string> | undefined;

  const metrics =
    fullDataset.employees.length > 0
      ? calculateAllMetrics(fullDataset.employees, fullDataset, departmentCategories)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Pay Gap Analysis</h1>
        <p className="text-sm text-stone-600 mt-1">
          Gender pay equity analysis and compensation distribution
        </p>
      </div>

      <AnalyticsPayGapTab
        datasetId={fullDataset.id}
        currency={fullDataset.currency}
        employees={fullDataset.employees}
        metrics={metrics}
        dataset={fullDataset}
      />
    </div>
  );
}
