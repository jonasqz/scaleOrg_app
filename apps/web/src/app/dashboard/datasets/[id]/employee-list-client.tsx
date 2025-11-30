'use client';

import { useState } from 'react';
import EmployeeRow from './employee-row';
import EmployeeDetailModal from './employee-detail-modal';

interface Employee {
  id: string;
  employeeName: string | null;
  email: string | null;
  department: string;
  role: string | null;
  level: string | null;
  employmentType: string;
  totalCompensation: number;
  baseSalary: number | null;
  bonus: number | null;
  equityValue: number | null;
  fteFactor: number;
  startDate: Date | null;
  location: string | null;
  managerId: string | null;
  costCenter: string | null;
}

interface EmployeeListClientProps {
  employees: Employee[];
  datasetId: string;
  currency: string;
}

export default function EmployeeListClient({
  employees,
  datasetId,
  currency,
}: EmployeeListClientProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Department
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Role
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Level
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                Compensation
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {employees.map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                datasetId={datasetId}
                currency={currency}
                onOpenDetail={() => setSelectedEmployee(employee)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          datasetId={datasetId}
          currency={currency}
          isOpen={true}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </>
  );
}
