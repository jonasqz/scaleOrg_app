import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@scleorg/database';
import CompensationTrackingClient from './compensation-tracking-client';

export default async function CompensationTrackingPage({
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
      employees: {
        where: {
          endDate: null, // Only active employees
        },
        orderBy: [
          { department: 'asc' },
          { employeeName: 'asc' },
        ],
      },
      settings: true,
    },
  });

  if (!dataset) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compensation Tracking</h1>
        <p className="mt-2 text-gray-600">
          Track planned vs. actual compensation, analyze burn rate, and forecast runway
        </p>
      </div>

      {/* Main Component */}
      <CompensationTrackingClient
        datasetId={dataset.id}
        currency={dataset.currency}
        currentCashBalance={dataset.currentCashBalance ? Number(dataset.currentCashBalance) : null}
        employees={dataset.employees.map(emp => ({
          ...emp,
          totalCompensation: Number(emp.totalCompensation),
          annualSalary: emp.annualSalary ? Number(emp.annualSalary) : null,
          bonus: emp.bonus ? Number(emp.bonus) : null,
          equityValue: emp.equityValue ? Number(emp.equityValue) : null,
          fteFactor: Number(emp.fteFactor),
        }))}
        departmentCategories={dataset.settings?.departmentCategories as Record<string, string> | undefined}
      />
    </div>
  );
}
