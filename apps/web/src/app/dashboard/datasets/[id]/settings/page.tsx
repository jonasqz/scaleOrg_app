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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">Company Settings</h1>
        <p className="mt-1 text-xs text-stone-500">
          Configure general settings, benchmarking, and department categorization
        </p>
      </div>

      {/* Settings Tabs */}
      <SettingsTabs datasetId={dataset.id} dataset={dataset} />
    </div>
  );
}
