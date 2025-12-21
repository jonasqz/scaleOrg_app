import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { id: datasetId } = await params;

  // Redirect to the analytics overview page
  redirect(`/dashboard/datasets/${datasetId}/analytics/overview`);
}
