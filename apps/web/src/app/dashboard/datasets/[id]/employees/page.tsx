import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@scleorg/database';
import { Users, Download } from 'lucide-react';
import Link from 'next/link';
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
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">Employees</h1>
        <p className="mt-1 text-xs text-stone-500">
          Manage your workforce data and employee information
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <AddEmployeeForm
            datasetId={dataset.id}
            currency={dataset.currency}
            allEmployees={dataset.employees}
          />
          <CSVUploadEnhanced datasetId={dataset.id} />
        </div>
        {dataset.employees.length > 0 && (
          <Link
            href={`/api/datasets/${dataset.id}/employees/export`}
            download
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Link>
        )}
      </div>

      {/* Employees Table */}
      {dataset.employees.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-3 text-sm text-stone-500">No employees yet.</p>
          <p className="mt-1 text-xs text-stone-400">
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
  );
}
