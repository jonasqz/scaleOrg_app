// Cost calculation functions

import type { Employee } from '@scleorg/database';
import {
  filterActiveEmployees,
  getTotalCompensation,
  getFTEFactor,
} from '../utils/aggregations';

export function calculateTotalCost(employees: Employee[]): number {
  const active = filterActiveEmployees(employees);
  return active.reduce((sum, emp) => sum + getTotalCompensation(emp), 0);
}

export function calculateTotalFTE(employees: Employee[]): number {
  const active = filterActiveEmployees(employees);
  return active.reduce((sum, emp) => sum + getFTEFactor(emp), 0);
}

export function calculateCostPerFTE(
  totalCost: number,
  totalFTE: number
): number {
  if (totalFTE === 0) return 0;
  return totalCost / totalFTE;
}

export function calculateDepartmentCost(
  employees: Employee[],
  department: string
): number {
  const active = filterActiveEmployees(employees);
  const deptEmployees = active.filter((emp) => emp.department === department);
  return deptEmployees.reduce(
    (sum, emp) => sum + getTotalCompensation(emp),
    0
  );
}

export function calculateDepartmentFTE(
  employees: Employee[],
  department: string
): number {
  const active = filterActiveEmployees(employees);
  const deptEmployees = active.filter((emp) => emp.department === department);
  return deptEmployees.reduce((sum, emp) => sum + getFTEFactor(emp), 0);
}
