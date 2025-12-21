import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@scleorg/database';
import ScenarioPlannerClient from './scenario-planner-client';

export default async function NewScenarioPage({
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

  // Get dataset with employees
  const dataset = await prisma.dataset.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
    include: {
      employees: {
        where: {
          endDate: null, // Only active employees
        },
        orderBy: { department: 'asc' },
      },
    },
  });

  if (!dataset) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/dashboard/datasets/${params.id}`}
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dataset
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-5">
        <div className="pb-4 border-b border-stone-200">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            Create Workforce Scenario
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Build a detailed workforce plan by selecting which employees to add or remove,
            and setting specific effective dates for each change.
          </p>
        </div>

        <ScenarioPlannerClient
          datasetId={dataset.id}
          datasetName={dataset.name}
          currency={dataset.currency}
          employees={dataset.employees}
        />
      </main>
    </div>
  );
}
