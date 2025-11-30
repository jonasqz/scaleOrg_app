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
            Create Workforce Scenario
          </h1>
          <p className="mt-2 text-gray-600">
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
