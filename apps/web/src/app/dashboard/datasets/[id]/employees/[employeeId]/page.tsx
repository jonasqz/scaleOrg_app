import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@scleorg/database';
import EmployeeDetailClient from './employee-detail-client';

export default async function EmployeeDetailPage({
  params,
}: {
  params: { id: string; employeeId: string };
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

  // Verify dataset ownership
  const dataset = await prisma.dataset.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
  });

  if (!dataset) {
    redirect('/dashboard');
  }

  // Get the employee
  const employee = await prisma.employee.findFirst({
    where: {
      id: params.employeeId,
      datasetId: params.id,
    },
  });

  if (!employee) {
    redirect(`/dashboard/datasets/${params.id}`);
  }

  // Get all employees for manager dropdown
  const allEmployees = await prisma.employee.findMany({
    where: {
      datasetId: params.id,
      endDate: null,
    },
    orderBy: {
      employeeName: 'asc',
    },
  });

  return (
    <EmployeeDetailClient
      employee={employee}
      datasetId={params.id}
      currency={dataset.currency}
      allEmployees={allEmployees}
    />
  );
}
