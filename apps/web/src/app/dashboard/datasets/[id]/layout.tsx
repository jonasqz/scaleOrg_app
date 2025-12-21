import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@scleorg/database';
import { verifyDatasetAccess } from '@/lib/access-control';
import DatasetSidebar from './dataset-sidebar';
import { DatasetExportProvider } from './dataset-export-provider';

export default async function DatasetLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
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

  const { id } = await params;

  // Verify dataset access (organization or personal)
  const dataset = await verifyDatasetAccess(id);

  if (!dataset) {
    redirect('/dashboard');
  }

  // Fetch employees for export functionality
  const fullDataset = await prisma.dataset.findUnique({
    where: { id },
    include: {
      employees: {
        orderBy: { createdAt: 'desc' },
      },
      settings: true,
    },
  });

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <DatasetSidebar datasetId={id} datasetName={dataset.name} />

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        <main className="container mx-auto px-6 py-6 max-w-7xl">
          {children}
        </main>
      </div>

      {/* Floating Export Button (shows only on analytics pages) */}
      <DatasetExportProvider
        datasetId={id}
        dataset={fullDataset || dataset}
        employees={fullDataset?.employees || []}
      />
    </div>
  );
}
