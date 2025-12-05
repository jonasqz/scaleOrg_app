import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@scleorg/database';
import ScenarioCompareClient from './scenario-compare-client';

export default async function ScenarioComparePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { scenarios?: string };
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

  // Get dataset
  const dataset = await prisma.dataset.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
  });

  if (!dataset) {
    notFound();
  }

  // Get all scenarios for this dataset
  const allScenarios = await prisma.scenario.findMany({
    where: {
      datasetId: dataset.id,
    },
    include: {
      results: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Parse selected scenario IDs from query params
  const selectedIds = searchParams.scenarios?.split(',').filter(Boolean) || [];

  // Get selected scenarios
  const selectedScenarios = allScenarios.filter((s: any) => selectedIds.includes(s.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/dashboard/datasets/${params.id}?tab=scenarios`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Scenarios
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Compare Scenarios
          </h1>
          <p className="mt-2 text-gray-600">
            Select 2-3 scenarios to compare side-by-side and analyze the differences
          </p>
        </div>

        <ScenarioCompareClient
          datasetId={dataset.id}
          datasetName={dataset.name}
          currency={dataset.currency}
          allScenarios={allScenarios}
          initialSelectedIds={selectedIds}
        />
      </main>
    </div>
  );
}
