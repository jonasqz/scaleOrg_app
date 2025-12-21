import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@scleorg/database';
import { verifyDatasetAccess } from '@/lib/access-control';
import EmployeeDetailClient from './employee-detail-client';

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string; employeeId: string }>;
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

  const { id, employeeId } = await params;

  // Verify dataset access (organization or personal)
  const dataset = await verifyDatasetAccess(id);

  if (!dataset) {
    redirect('/dashboard');
  }

  // Get the employee with compensation data
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      datasetId: id,
    },
    include: {
      compensationTargets: {
        include: {
          scenario: true,
        },
      },
      monthlyPlannedCompensation: {
        orderBy: { period: 'asc' },
      },
    },
  });

  if (!employee) {
    redirect(`/dashboard/datasets/${id}`);
  }

  // Get all employees for manager dropdown
  const allEmployees = await prisma.employee.findMany({
    where: {
      datasetId: id,
      endDate: null,
    },
    orderBy: {
      employeeName: 'asc',
    },
  });

  // Get active compensation scenarios
  const scenarios = await prisma.compensationScenario.findMany({
    where: {
      datasetId: id,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <EmployeeDetailClient
      employee={employee}
      datasetId={id}
      currency={dataset.currency}
      allEmployees={allEmployees}
      scenarios={scenarios}
    />
  );
}
