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
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/dashboard/datasets/${params.id}?tab=scenarios`}
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Scenarios
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-5">
        <div className="pb-4 border-b border-stone-200">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            Compare Scenarios
          </h1>
          <p className="mt-1 text-xs text-stone-500">
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
