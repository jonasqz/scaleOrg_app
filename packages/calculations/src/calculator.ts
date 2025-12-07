// Main calculation orchestrator

import type { Employee, Dataset } from '@scleorg/database';
import type {
  CalculationResult,
  SummaryMetrics,
  OutlierAnalysis,
} from '@scleorg/types';
import {
  calculateTotalCost,
  calculateTotalFTE,
  calculateCostPerFTE,
} from './core/cost';
import {
  calculateDepartmentBreakdown,
  calculateRatios,
} from './core/structure';
import { calculateRevenuePerFTE } from './core/productivity';
import {
  detectHighCostOutliers,
  detectLowSpanManagers,
} from './core/outliers';
import { calculateTenureMetrics } from './core/tenure';
import { filterActiveEmployees } from './utils/aggregations';

export function calculateAllMetrics(
  employees: Employee[],
  dataset: Dataset,
  departmentCategories?: Record<string, string>
): CalculationResult {
  const active = filterActiveEmployees(employees);

  // Calculate summary metrics
  const totalCost = calculateTotalCost(active);
  const totalFTE = calculateTotalFTE(active);
  const costPerFTE = calculateCostPerFTE(totalCost, totalFTE);

  const totalRevenue = dataset.totalRevenue
    ? Number(dataset.totalRevenue)
    : null;
  const revenuePerFTE = calculateRevenuePerFTE(totalRevenue, totalFTE);

  const summary: SummaryMetrics = {
    totalFTE,
    totalCost,
    costPerFTE,
    revenuePerFTE,
    employeeCount: active.length,
  };

  // Calculate department breakdown with custom categories
  const departments = calculateDepartmentBreakdown(active, departmentCategories);

  // Calculate ratios
  const ratios = calculateRatios(active, departments);

  // Detect outliers
  const outliers: OutlierAnalysis = {
    highCostEmployees: detectHighCostOutliers(active),
    lowSpanManagers: detectLowSpanManagers(active),
    departmentImbalances: [], // To be implemented based on benchmarks
  };

  // Calculate tenure metrics
  const tenure = calculateTenureMetrics(active);

  return {
    datasetId: dataset.id,
    calculatedAt: new Date(),
    summary,
    departments,
    ratios,
    outliers,
    tenure,
  };
}
