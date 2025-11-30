// Productivity metrics calculations

import type { Employee } from '@scleorg/database';
import { filterActiveEmployees } from '../utils/aggregations';

export function calculateRevenuePerFTE(
  totalRevenue: number | null,
  totalFTE: number
): number | null {
  if (!totalRevenue || totalFTE === 0) return null;
  return totalRevenue / totalFTE;
}

export function calculateEngineersPerPM(employees: Employee[]): number {
  const active = filterActiveEmployees(employees);

  const engineers = active.filter(
    (emp) =>
      emp.department.toLowerCase().includes('eng') ||
      emp.role?.toLowerCase().includes('engineer')
  );

  const pms = active.filter(
    (emp) =>
      emp.department.toLowerCase().includes('product') ||
      emp.role?.toLowerCase().includes('product manager') ||
      emp.role?.toLowerCase().includes('pm')
  );

  if (pms.length === 0) return 0;
  return engineers.length / pms.length;
}

export function calculateEngineersPerMillion(
  employees: Employee[],
  totalRevenue: number | null
): number | null {
  if (!totalRevenue || totalRevenue === 0) return null;

  const active = filterActiveEmployees(employees);
  const engineers = active.filter(
    (emp) =>
      emp.department.toLowerCase().includes('eng') ||
      emp.role?.toLowerCase().includes('engineer')
  );

  const revenueInMillions = totalRevenue / 1000000;
  return engineers.length / revenueInMillions;
}
