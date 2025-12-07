import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@scleorg/database';
import CashFlowClient from './cash-flow-client';

export default async function CashFlowPage({
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
  });

  if (!dataset) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cash Flow & Runway</h1>
        <p className="mt-2 text-gray-600">
          Track revenue, monitor burn rate, and forecast your cash runway
        </p>
      </div>

      {/* Main Component */}
      <CashFlowClient
        datasetId={dataset.id}
        currency={dataset.currency}
        currentCashBalance={dataset.currentCashBalance ? Number(dataset.currentCashBalance) : null}
      />
    </div>
  );
}
