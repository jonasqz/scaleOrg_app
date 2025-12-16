'use client';

import EmployeeDetailPageView from './employee-detail-page-view';

interface EmployeeDetailClientProps {
  employee: any;
  datasetId: string;
  currency: string;
  allEmployees: any[];
}

export default function EmployeeDetailClient({
  employee,
  datasetId,
  currency,
  allEmployees,
}: EmployeeDetailClientProps) {
  // Convert Prisma decimal/bigint to numbers
  const formattedEmployee = {
    ...employee,
    totalCompensation: Number(employee.totalCompensation),
    annualSalary: employee.annualSalary ? Number(employee.annualSalary) : null,
    bonus: employee.bonus ? Number(employee.bonus) : null,
    equityValue: employee.equityValue ? Number(employee.equityValue) : null,
    fteFactor: Number(employee.fteFactor),
  };

  const formattedAllEmployees = allEmployees.map(emp => ({
    ...emp,
    totalCompensation: Number(emp.totalCompensation),
    annualSalary: emp.annualSalary ? Number(emp.annualSalary) : null,
    bonus: emp.bonus ? Number(emp.bonus) : null,
    equityValue: emp.equityValue ? Number(emp.equityValue) : null,
    fteFactor: Number(emp.fteFactor),
  }));

  return (
    <EmployeeDetailPageView
      employee={formattedEmployee}
      datasetId={datasetId}
      currency={currency}
      allEmployees={formattedAllEmployees}
    />
  );
}
