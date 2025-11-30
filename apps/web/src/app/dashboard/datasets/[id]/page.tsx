import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@scleorg/database';
import { calculateAllMetrics } from '@scleorg/calculations';
import DatasetTabs from './dataset-tabs';

export default async function DatasetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect('/sign-in');
  }

  // Get dataset with employees
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

  // Calculate metrics if we have employees
  const metrics =
    dataset.employees.length > 0
      ? calculateAllMetrics(dataset.employees, dataset)
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Datasets
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Dataset Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {dataset.name}
          </h1>
          {dataset.description && (
            <p className="text-gray-600">{dataset.description}</p>
          )}
          {dataset.companyName && (
            <p className="mt-1 text-sm text-gray-500">{dataset.companyName}</p>
          )}
        </div>

        {/* Tabbed Content */}
        <DatasetTabs
          datasetId={dataset.id}
          currency={dataset.currency}
          employees={dataset.employees}
          metrics={metrics}
        />
      </main>
    </div>
  );
}
