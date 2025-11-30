import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@scleorg/database';
import ScenarioEditorClient from './scenario-editor-client';

export default async function ScenarioDetailPage({
  params,
}: {
  params: { id: string; scenarioId: string };
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

  // Get dataset with employees
  const dataset = await prisma.dataset.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
    include: {
      employees: {
        orderBy: { department: 'asc' },
      },
    },
  });

  if (!dataset) {
    notFound();
  }

  // Get scenario
  const scenario = await prisma.scenario.findFirst({
    where: {
      id: params.scenarioId,
      datasetId: dataset.id,
    },
    include: {
      results: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!scenario) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/dashboard/datasets/${params.id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dataset
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {scenario.name}
          </h1>
          {scenario.description && (
            <p className="mt-2 text-gray-600">{scenario.description}</p>
          )}
        </div>

        <ScenarioEditorClient
          scenarioId={scenario.id}
          datasetId={dataset.id}
          datasetName={dataset.name}
          currency={dataset.currency}
          employees={dataset.employees}
          initialScenario={scenario}
        />
      </main>
    </div>
  );
}
