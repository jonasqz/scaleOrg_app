// Outlier detection functions

import type { Employee } from '@scleorg/database';
import type { OutlierEmployee, OutlierManager } from '@scleorg/types';
import {
  filterActiveEmployees,
  getTotalCompensation,
} from '../utils/aggregations';
import { average, standardDeviation, zScore as calcZScore } from '../utils/statistics';

export function detectHighCostOutliers(
  employees: Employee[],
  threshold: number = 2.5
): OutlierEmployee[] {
  const active = filterActiveEmployees(employees);
  const compensations = active.map((e) => getTotalCompensation(e));

  const mean = average(compensations);
  const stdDev = standardDeviation(compensations);

  return active
    .map((emp) => {
      const comp = getTotalCompensation(emp);
      const zScore = calcZScore(comp, mean, stdDev);
      return {
        employee: emp,
        zScore,
      };
    })
    .filter((item) => item.zScore > threshold)
    .map((item) => {
      const comp = getTotalCompensation(item.employee);
      return {
        employeeId: item.employee.employeeId || item.employee.id,
        department: item.employee.department,
        role: item.employee.role || undefined,
        totalCompensation: comp,
        zScore: item.zScore,
        deltaFromMean: comp - mean,
      };
    })
    .sort((a, b) => b.zScore - a.zScore);
}

export function detectLowSpanManagers(
  employees: Employee[],
  minSpan: number = 3
): OutlierManager[] {
  const active = filterActiveEmployees(employees);
  const managerReports = new Map<string, Employee[]>();

  active.forEach((emp) => {
    if (emp.managerId) {
      if (!managerReports.has(emp.managerId)) {
        managerReports.set(emp.managerId, []);
      }
      managerReports.get(emp.managerId)!.push(emp);
    }
  });

  const outliers: OutlierManager[] = [];

  managerReports.forEach((reports, managerId) => {
    if (reports.length < minSpan) {
      const manager = active.find((e) => e.id === managerId);
      if (manager) {
        outliers.push({
          managerId,
          managerName: manager.employeeName || undefined,
          department: manager.department,
          directReportsCount: reports.length,
          expectedMin: minSpan,
        });
      }
    }
  });

  return outliers;
}
