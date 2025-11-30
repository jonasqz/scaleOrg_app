// Common aggregation utilities

import type { Employee } from '@scleorg/database';

export function groupByDepartment(
  employees: Employee[]
): Map<string, Employee[]> {
  const groups = new Map<string, Employee[]>();

  employees.forEach((emp) => {
    const dept = emp.department;
    if (!groups.has(dept)) {
      groups.set(dept, []);
    }
    groups.get(dept)!.push(emp);
  });

  return groups;
}

export function filterActiveEmployees(employees: Employee[]): Employee[] {
  const now = new Date();
  return employees.filter((emp) => !emp.endDate || emp.endDate > now);
}

export function getTotalCompensation(employee: Employee): number {
  return Number(employee.totalCompensation);
}

export function getFTEFactor(employee: Employee): number {
  return Number(employee.fteFactor);
}
