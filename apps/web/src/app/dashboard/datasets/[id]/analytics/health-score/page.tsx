import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { verifyDatasetAccess } from '@/lib/access-control';
import HealthScoreDashboard from '../../health-score-dashboard';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HealthScorePage({ params }: PageProps) {
  const { id: datasetId } = await params;

  // Verify dataset access
  const dataset = await verifyDatasetAccess(datasetId);

  if (!dataset) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Organizational Health Score</h1>
        <p className="text-sm text-stone-600 mt-1">
          Comprehensive analysis of workforce health across 6 key dimensions
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-xs text-stone-600">Loading health score...</p>
            </div>
          </div>
        }
      >
        <HealthScoreDashboard datasetId={datasetId} />
      </Suspense>
    </div>
  );
}
