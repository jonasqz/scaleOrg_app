// Structural metrics calculations

import type { Employee } from '@scleorg/database';
import type { DepartmentBreakdown, RatioMetrics } from '@scleorg/types';
import {
  filterActiveEmployees,
  groupByDepartment,
  getTotalCompensation,
  getFTEFactor,
} from '../utils/aggregations';
import { normalizeDepartment } from '../utils/normalizations';
import { calculateTotalCost } from './cost';

export function calculateDepartmentBreakdown(
  employees: Employee[]
): DepartmentBreakdown {
  const active = filterActiveEmployees(employees);
  const totalCost = calculateTotalCost(active);

  // Group by normalized department
  const deptMap = new Map<string, Employee[]>();

  active.forEach((emp) => {
    const dept = normalizeDepartment(emp.department);
    if (!deptMap.has(dept)) {
      deptMap.set(dept, []);
    }
    deptMap.get(dept)!.push(emp);
  });

  const breakdown: DepartmentBreakdown = {};

  deptMap.forEach((deptEmployees, dept) => {
    const cost = deptEmployees.reduce(
      (sum, emp) => sum + getTotalCompensation(emp),
      0
    );
    const fte = deptEmployees.reduce((sum, emp) => sum + getFTEFactor(emp), 0);

    breakdown[dept] = {
      fte,
      cost,
      avgCompensation: fte > 0 ? cost / fte : 0,
      percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
      employeeCount: deptEmployees.length,
    };
  });

  return breakdown;
}

export function calculateRDtoGTMRatio(breakdown: DepartmentBreakdown): number {
  const rdFTE = breakdown['R&D']?.fte || 0;
  const gtmFTE = breakdown['GTM']?.fte || 0;

  if (gtmFTE === 0) return 0;
  return rdFTE / gtmFTE;
}

export function calculateManagerToICRatio(employees: Employee[]): number {
  const active = filterActiveEmployees(employees);

  const managers = active.filter(
    (emp) =>
      emp.level &&
      ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'].includes(emp.level)
  );
  const ics = active.filter((emp) => !emp.level || emp.level === 'IC');

  if (ics.length === 0) return 0;
  return managers.length / ics.length;
}

export function calculateAvgSpanOfControl(employees: Employee[]): number {
  const active = filterActiveEmployees(employees);
  const managerCounts = new Map<string, number>();

  active.forEach((emp) => {
    if (emp.managerId) {
      const count = managerCounts.get(emp.managerId) || 0;
      managerCounts.set(emp.managerId, count + 1);
    }
  });

  if (managerCounts.size === 0) return 0;

  const totalReports = Array.from(managerCounts.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  return totalReports / managerCounts.size;
}

export function calculateRatios(
  employees: Employee[],
  breakdown: DepartmentBreakdown
): RatioMetrics {
  return {
    rdToGTM: calculateRDtoGTMRatio(breakdown),
    managerToIC: calculateManagerToICRatio(employees),
    avgSpanOfControl: calculateAvgSpanOfControl(employees),
  };
}
