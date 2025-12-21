import React from 'react';
import { Users } from 'lucide-react';
import { BrandingConfig } from '@/lib/export-types';

interface EmployeeDetailsSlideProps {
  employees: any[];
  currency: string;
  branding: BrandingConfig;
  includeCompensation?: boolean;
}

export function EmployeeDetailsSlide({
  employees,
  currency,
  branding,
  includeCompensation = true,
}: EmployeeDetailsSlideProps) {
  // Sort employees by department, then by total compensation
  const sortedEmployees = [...employees].sort((a, b) => {
    if (a.department !== b.department) {
      return a.department.localeCompare(b.department);
    }
    return (b.totalCompensation || 0) - (a.totalCompensation || 0);
  });

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '—';
    // Convert to number in case it's a Decimal object from Prisma
    const numValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numValue)) return '—';

    const absValue = Math.abs(numValue);
    if (absValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(2)}M`;
    } else if (absValue >= 1000) {
      return `${(numValue / 1000).toFixed(0)}k`;
    }
    return numValue.toFixed(0);
  };

  // Split into pages if more than 20 employees
  const employeesPerPage = 20;
  const pageCount = Math.ceil(sortedEmployees.length / employeesPerPage);

  return (
    <>
      {Array.from({ length: pageCount }).map((_, pageIndex) => {
        const startIndex = pageIndex * employeesPerPage;
        const pageEmployees = sortedEmployees.slice(
          startIndex,
          startIndex + employeesPerPage
        );

        return (
          <div
            key={pageIndex}
            className="flex h-[768px] w-[1024px] flex-col bg-white print:break-after-page"
          >
            {/* Header */}
            <div
              className="border-b p-8"
              style={{ borderColor: branding.primaryColor + '20' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className="text-3xl font-bold"
                    style={{ color: branding.primaryColor }}
                  >
                    Employee Directory
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    {pageCount > 1
                      ? `Page ${pageIndex + 1} of ${pageCount} • ${pageEmployees.length} employees`
                      : `${employees.length} total employees`}
                  </p>
                </div>
                <Users className="h-12 w-12 text-gray-300" />
              </div>
            </div>

            {/* Content - Employee Table */}
            <div className="flex-1 overflow-hidden p-8">
              <div className="rounded-lg border border-gray-200 overflow-hidden h-full">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                        Department
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase">
                        Level
                      </th>
                      {includeCompensation && (
                        <>
                          <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">
                            Base
                          </th>
                          <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">
                            Bonus
                          </th>
                          <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">
                            Total
                          </th>
                        </>
                      )}
                      <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase">
                        Start Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {pageEmployees.map((employee, idx) => (
                      <tr
                        key={employee.id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {employee.employeeName || 'Unnamed'}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {employee.department || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {employee.role || '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              employee.level === 'C_LEVEL'
                                ? 'bg-purple-100 text-purple-800'
                                : employee.level === 'VP'
                                ? 'bg-blue-100 text-blue-800'
                                : employee.level === 'DIRECTOR'
                                ? 'bg-green-100 text-green-800'
                                : employee.level === 'MANAGER'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {employee.level === 'C_LEVEL' ? 'C-Level' : employee.level || 'IC'}
                          </span>
                        </td>
                        {includeCompensation && (
                          <>
                            <td className="px-3 py-2 text-right text-gray-900">
                              {currency} {formatCurrency(employee.annualSalary)}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              {currency} {formatCurrency(employee.bonus)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-900">
                              {currency} {formatCurrency(employee.totalCompensation)}
                            </td>
                          </>
                        )}
                        <td className="px-3 py-2 text-center text-gray-600">
                          {employee.startDate
                            ? new Date(employee.startDate).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-8 py-4">
              <p className="text-xs text-gray-500">
                {includeCompensation
                  ? 'Confidential employee compensation data'
                  : 'Employee roster'}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}
