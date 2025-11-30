// Scenario transformation functions

import type { Employee, OpenRole } from '@scleorg/database';
import type { ScenarioResult, SummaryMetrics } from '@scleorg/types';
import {
  calculateTotalCost,
  calculateTotalFTE,
  calculateCostPerFTE,
} from '../core/cost';
import { calculateDepartmentBreakdown, calculateRDtoGTMRatio } from '../core/structure';
import { normalizeDepartment } from '../utils/normalizations';
import { filterActiveEmployees } from '../utils/aggregations';

export function applyHiringFreeze(
  employees: Employee[],
  openRoles: OpenRole[]
): { employees: Employee[]; openRoles: OpenRole[] } {
  return {
    employees,
    openRoles: [], // Remove all open roles
  };
}

export function applyCostReduction(
  employees: Employee[],
  reductionPct: number,
  targetDepartments?: string[]
): Employee[] {
  const active = filterActiveEmployees(employees);
  const totalCost = calculateTotalCost(active);
  const targetReduction = totalCost * (reductionPct / 100);

  // Filter to target departments if specified
  let candidates = targetDepartments
    ? active.filter((e) => {
        const normalizedDept = normalizeDepartment(e.department);
        return targetDepartments.includes(normalizedDept);
      })
    : active;

  // Sort by cost (highest first)
  candidates.sort(
    (a, b) => Number(b.totalCompensation) - Number(a.totalCompensation)
  );

  let removedCost = 0;
  const removedIds = new Set<string>();

  for (const emp of candidates) {
    if (removedCost >= targetReduction) break;
    removedIds.add(emp.id);
    removedCost += Number(emp.totalCompensation);
  }

  return active.filter((emp) => !removedIds.has(emp.id));
}

export function applyGrowth(
  employees: Employee[],
  additionalFTE: number,
  distribution: { [dept: string]: number } // Percentages (should sum to 1.0)
): Employee[] {
  const active = filterActiveEmployees(employees);
  const breakdown = calculateDepartmentBreakdown(active);
  const newEmployees: Employee[] = [];

  Object.entries(distribution).forEach(([dept, pct]) => {
    const deptFTE = Math.round(additionalFTE * pct);
    const avgSalary = breakdown[dept]?.avgCompensation || 100000;

    for (let i = 0; i < deptFTE; i++) {
      newEmployees.push({
        id: `new_${dept}_${i}`,
        datasetId: active[0]?.datasetId || '',
        employeeId: `NEW_${dept}_${i}`,
        employeeName: `New Hire ${i + 1}`,
        department: dept,
        employmentType: 'FTE',
        fteFactor: 1.0 as any,
        annualSalary: avgSalary as any,
        totalCompensation: avgSalary as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        level: null,
        role: null,
        managerId: null,
        costCenter: null,
        location: null,
        email: null,
        bonus: null,
        equityValue: null,
        startDate: null,
        endDate: null,
      } as Employee);
    }
  });

  return [...active, ...newEmployees];
}

export function applyTargetRatio(
  employees: Employee[],
  targetRatio: number
): Employee[] {
  const active = filterActiveEmployees(employees);
  const breakdown = calculateDepartmentBreakdown(active);
  const currentRatio = calculateRDtoGTMRatio(breakdown);

  if (currentRatio === 0 || !isFinite(currentRatio)) {
    return active;
  }

  const currentRDFTE = breakdown['R&D']?.fte || 0;
  const currentGTMFTE = breakdown['GTM']?.fte || 0;

  if (currentRatio > targetRatio) {
    // Too much R&D, add GTM
    const neededGTMFTE = currentRDFTE / targetRatio - currentGTMFTE;
    return applyGrowth(active, Math.max(0, Math.ceil(neededGTMFTE)), {
      GTM: 1.0,
    });
  } else {
    // Too much GTM, add R&D
    const neededRDFTE = currentGTMFTE * targetRatio - currentRDFTE;
    return applyGrowth(active, Math.max(0, Math.ceil(neededRDFTE)), {
      'R&D': 1.0,
    });
  }
}

export function calculateScenarioMetrics(
  baselineEmployees: Employee[],
  scenarioEmployees: Employee[],
  totalRevenue: number | null
): ScenarioResult {
  const baselineCost = calculateTotalCost(baselineEmployees);
  const baselineFTE = calculateTotalFTE(baselineEmployees);
  const baselineCostPerFTE = calculateCostPerFTE(baselineCost, baselineFTE);
  const baselineBreakdown = calculateDepartmentBreakdown(baselineEmployees);

  const scenarioCost = calculateTotalCost(scenarioEmployees);
  const scenarioFTE = calculateTotalFTE(scenarioEmployees);
  const scenarioCostPerFTE = calculateCostPerFTE(scenarioCost, scenarioFTE);
  const scenarioBreakdown = calculateDepartmentBreakdown(scenarioEmployees);

  const baseline: SummaryMetrics = {
    totalFTE: baselineFTE,
    totalCost: baselineCost,
    costPerFTE: baselineCostPerFTE,
    revenuePerFTE: totalRevenue ? totalRevenue / baselineFTE : null,
    employeeCount: filterActiveEmployees(baselineEmployees).length,
  };

  const scenario: SummaryMetrics = {
    totalFTE: scenarioFTE,
    totalCost: scenarioCost,
    costPerFTE: scenarioCostPerFTE,
    revenuePerFTE: totalRevenue ? totalRevenue / scenarioFTE : null,
    employeeCount: filterActiveEmployees(scenarioEmployees).length,
  };

  const delta = {
    fteChange: scenarioFTE - baselineFTE,
    costSavings: baselineCost - scenarioCost,
    costSavingsPct:
      baselineCost > 0 ? ((baselineCost - scenarioCost) / baselineCost) * 100 : 0,
    ratioChange:
      calculateRDtoGTMRatio(scenarioBreakdown) -
      calculateRDtoGTMRatio(baselineBreakdown),
  };

  return {
    baseline,
    scenario,
    delta,
  };
}
