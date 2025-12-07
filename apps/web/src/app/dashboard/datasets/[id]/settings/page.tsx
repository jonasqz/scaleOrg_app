import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@scleorg/database';
import SettingsTabs from '../settings-tabs';

export default async function SettingsPage({
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
    include: {
      settings: true,
    },
  });

  if (!dataset) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dataset Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure general settings, benchmarking, and department categorization
        </p>
      </div>

      {/* Settings Tabs */}
      <SettingsTabs datasetId={dataset.id} dataset={dataset} />
    </div>
  );
}
