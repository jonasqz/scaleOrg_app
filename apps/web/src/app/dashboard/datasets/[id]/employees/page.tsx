import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@scleorg/database';
import { Users } from 'lucide-react';
import AddEmployeeForm from '../add-employee-form';
import CSVUploadEnhanced from '../csv-upload-enhanced';
import EmployeeTableEnhanced from '../employee-table-enhanced';

export default async function EmployeesPage({
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
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!dataset) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
        <p className="mt-2 text-gray-600">
          Manage your workforce data and employee information
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <AddEmployeeForm
          datasetId={dataset.id}
          currency={dataset.currency}
          allEmployees={dataset.employees}
        />
        <CSVUploadEnhanced datasetId={dataset.id} />
      </div>

      {/* Employees Table */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            All Employees ({dataset.employees.length})
          </h2>
        </div>

        {dataset.employees.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">No employees yet.</p>
            <p className="mt-1 text-sm text-gray-400">
              Add your first employee above or import from CSV
            </p>
          </div>
        ) : (
          <EmployeeTableEnhanced
            employees={dataset.employees}
            datasetId={dataset.id}
            currency={dataset.currency}
          />
        )}
      </div>
    </div>
  );
}
