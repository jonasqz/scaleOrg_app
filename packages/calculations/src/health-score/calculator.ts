/**
 * Health Score Calculator
 *
 * Main calculation engine that computes organizational health scores
 * from employee data, metrics, and benchmarks
 */

import type { Employee } from '@scleorg/database';
import type { HealthScore, DimensionScore, MetricScore, HealthStatus } from './types';
import { DIMENSION_DEFINITIONS } from './definitions';
import { scoreMetric, calculateWeightedScore, scoreToGrade, scoreToStatus, calculateTrend } from './scoring-engine';
import { calculateKPIs } from '../kpis/calculator';
import type { EmployeeData } from '../kpis/calculator';

interface HealthScoreInput {
  employees: Employee[];
  metadata: {
    totalRevenue?: number;
    currency: string;
    currentCashBalance?: number;
  };
  benchmarks?: Record<string, { low: number; median: number; high: number }>;
  departmentCategories?: Record<string, string>;
  previousScore?: number;
  monthlyEmployerCosts?: any[];
  monthlyPlannedCompensation?: any[];
}

/**
 * Extract metric values from employee data and KPI calculations
 */
function extractMetricValues(
  employees: Employee[],
  metadata: HealthScoreInput['metadata'],
  departmentCategories?: Record<string, string>,
  monthlyEmployerCosts?: any[]
): Record<string, number | null> {
  // Convert employees to KPI calculator format
  const employeeData: EmployeeData[] = employees.map((emp) => ({
    id: emp.id,
    department: emp.department,
    annualSalary: Number(emp.annualSalary || 0),
    totalCompensation: Number(emp.totalCompensation),
    employmentType: emp.employmentType,
    fteFactor: Number(emp.fteFactor),
    level: emp.level || undefined,
    location: emp.location || undefined,
    startDate: emp.startDate || undefined,
    endDate: emp.endDate || undefined,
  }));

  // Calculate KPIs
  const kpis = calculateKPIs(employeeData, metadata);
  const kpiMap = new Map(kpis.map((k) => [k.kpiId, k.value]));

  // Calculate additional metrics not in KPI system
  const activeEmployees = employees.filter((e) => !e.endDate || e.endDate > new Date());
  const totalEmployees = activeEmployees.length;

  // Gender pay gap calculation
  const maleEmployees = activeEmployees.filter((e) => e.gender === 'MALE');
  const femaleEmployees = activeEmployees.filter((e) => e.gender === 'FEMALE');

  let genderPayGapMedian: number | null = null;
  let genderPayGapMean: number | null = null;

  if (maleEmployees.length > 0 && femaleEmployees.length > 0) {
    const maleComps = maleEmployees.map((e) => Number(e.totalCompensation)).sort((a, b) => a - b);
    const femaleComps = femaleEmployees.map((e) => Number(e.totalCompensation)).sort((a, b) => a - b);

    const maleMedian =
      maleComps.length % 2 === 0
        ? (maleComps[maleComps.length / 2 - 1] + maleComps[maleComps.length / 2]) / 2
        : maleComps[Math.floor(maleComps.length / 2)];

    const femaleMedian =
      femaleComps.length % 2 === 0
        ? (femaleComps[femaleComps.length / 2 - 1] + femaleComps[femaleComps.length / 2]) / 2
        : femaleComps[Math.floor(femaleComps.length / 2)];

    const maleMean = maleComps.reduce((sum, c) => sum + c, 0) / maleComps.length;
    const femaleMean = femaleComps.reduce((sum, c) => sum + c, 0) / femaleComps.length;

    genderPayGapMedian = maleMedian > 0 ? Math.abs(((maleMedian - femaleMedian) / maleMedian) * 100) : null;
    genderPayGapMean = maleMean > 0 ? Math.abs(((maleMean - femaleMean) / maleMean) * 100) : null;
  }

  // Internal pay equity (p90/p10 ratio)
  const allComps = activeEmployees.map((e) => Number(e.totalCompensation)).sort((a, b) => a - b);
  const p10Index = Math.floor(allComps.length * 0.1);
  const p90Index = Math.floor(allComps.length * 0.9);
  const internalPayEquity = allComps.length > 0 ? allComps[p90Index] / allComps[p10Index] : null;

  // Manager span of control metrics
  const managersWithReports = new Map<string, number>();
  activeEmployees.forEach((emp) => {
    if (emp.managerId) {
      const count = managersWithReports.get(emp.managerId) || 0;
      managersWithReports.set(emp.managerId, count + 1);
    }
  });

  const spanCounts = Array.from(managersWithReports.values());
  const lowSpanManagers = spanCounts.filter((count) => count < 5).length;
  const highSpanManagers = spanCounts.filter((count) => count > 10).length;
  const totalManagers = spanCounts.length;

  const lowSpanPct = totalManagers > 0 ? (lowSpanManagers / totalManagers) * 100 : null;
  const highSpanPct = totalManagers > 0 ? (highSpanManagers / totalManagers) * 100 : null;

  // Management overhead
  const managementLevels = ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'];
  const managementCount = activeEmployees.filter((e) => e.level && managementLevels.includes(e.level)).length;
  const managementOverhead = totalEmployees > 0 ? (managementCount / totalEmployees) * 100 : null;

  // Cost management metrics
  let employerCostRatio: number | null = null;
  let monthlyCostGrowth: number | null = null;
  let costPerEmployeeTrend: number | null = null;

  if (monthlyEmployerCosts && monthlyEmployerCosts.length > 1) {
    // Get most recent month
    const sorted = [...monthlyEmployerCosts].sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());
    const recent = sorted[0];
    const previous = sorted[1];

    if (recent.avgCostRatio) {
      employerCostRatio = Number(recent.avgCostRatio);
    }

    if (recent.totalCost && previous.totalCost) {
      const totalCostRecent = Number(recent.totalCost);
      const totalCostPrevious = Number(previous.totalCost);
      monthlyCostGrowth = ((totalCostRecent - totalCostPrevious) / totalCostPrevious) * 100;
    }

    if (recent.avgCostPerEmployee && previous.avgCostPerEmployee) {
      const costPerEmpRecent = Number(recent.avgCostPerEmployee);
      const costPerEmpPrevious = Number(previous.avgCostPerEmployee);
      costPerEmployeeTrend = ((costPerEmpRecent - costPerEmpPrevious) / costPerEmpPrevious) * 100;
    }
  }

  // Location distribution
  const highCostCountries = ['united states', 'usa', 'us', 'switzerland', 'norway', 'denmark', 'sweden', 'united kingdom', 'uk', 'germany', 'france', 'netherlands', 'belgium', 'australia', 'canada', 'singapore'];
  const inHighCost = activeEmployees.filter((e) => {
    if (!e.location) return false;
    const loc = e.location.toLowerCase();
    return highCostCountries.some((country) => loc.includes(country));
  }).length;
  const locationDistribution = totalEmployees > 0 ? inHighCost / totalEmployees : null;

  // Runway months
  let runwayMonths: number | null = null;
  if (metadata.currentCashBalance && monthlyEmployerCosts && monthlyEmployerCosts.length > 0) {
    const sorted = [...monthlyEmployerCosts].sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());
    const avgMonthlyBurn = Number(sorted[0]?.totalCost || 0);
    if (avgMonthlyBurn > 0) {
      runwayMonths = Number(metadata.currentCashBalance) / avgMonthlyBurn;
    }
  }

  // Map all metrics
  return {
    // Financial Efficiency
    revenue_per_employee: kpiMap.get('revenue_per_employee') || null,
    personnel_cost_pct_revenue: kpiMap.get('personnel_cost_pct_revenue') || null,
    salary_cost_pct_revenue: kpiMap.get('salary_cost_pct_revenue') || null,
    eng_revenue_per_fte: kpiMap.get('revenue_per_eng') || null,
    sales_revenue_per_fte: kpiMap.get('revenue_per_sales') || null,

    // Organizational Structure
    rd_to_gtm_ratio: kpiMap.get('span_of_control') || null, // Note: This should use actual R&D to GTM calculation
    span_of_control: kpiMap.get('span_of_control') || null,
    manager_to_ic_ratio: null, // TODO: Calculate from employee levels
    eng_pct_employees: kpiMap.get('eng_pct_employees') || null,
    department_balance: null, // TODO: Calculate department variance

    // Talent & Retention
    employee_tenure: kpiMap.get('employee_tenure') || null,
    turnover_pct: kpiMap.get('turnover_pct') || null,
    new_hires_pct: kpiMap.get('new_hires_pct') || null,
    location_distribution: locationDistribution,

    // Pay Equity
    gender_pay_gap_median: genderPayGapMedian,
    gender_pay_gap_mean: genderPayGapMean,
    internal_pay_equity: internalPayEquity,
    benchmark_alignment: null, // TODO: Calculate from benchmark comparison

    // Team Effectiveness
    low_span_managers: lowSpanPct,
    high_span_managers: highSpanPct,
    dept_revenue_efficiency: null, // TODO: Calculate from department metrics
    management_overhead: managementOverhead,

    // Cost Management
    employer_cost_ratio: employerCostRatio,
    monthly_cost_growth: monthlyCostGrowth,
    cost_per_employee_trend: costPerEmployeeTrend,
    budget_variance: null, // TODO: Calculate from planned vs actual
    runway_months: runwayMonths,
  };
}

/**
 * Calculate organizational health score
 */
export function calculateHealthScore(input: HealthScoreInput): HealthScore {
  const metricValues = extractMetricValues(
    input.employees,
    input.metadata,
    input.departmentCategories,
    input.monthlyEmployerCosts
  );

  // Calculate scores for each dimension
  const dimensions: DimensionScore[] = DIMENSION_DEFINITIONS.map((dimDef) => {
    // Score each metric in this dimension
    const metrics: MetricScore[] = dimDef.metrics.map((rule) => {
      const value = metricValues[rule.metricId];
      return scoreMetric(rule, value, input.benchmarks);
    });

    // Calculate dimension score (weighted average of metrics)
    const dimensionScore = calculateWeightedScore(metrics);

    // Calculate data completeness
    const metricsWithData = metrics.filter((m) => m.value !== null).length;
    const dataCompleteness = dimDef.metrics.length > 0 ? (metricsWithData / dimDef.metrics.length) * 100 : 0;

    return {
      dimension: dimDef.id,
      name: dimDef.name,
      description: dimDef.description,
      score: dimensionScore,
      weight: dimDef.weight,
      status: scoreToStatus(dimensionScore),
      metrics,
      metricsAvailable: metricsWithData,
      metricsTotal: dimDef.metrics.length,
      dataCompleteness,
    };
  });

  // Calculate overall score (weighted average of dimensions)
  // Only include dimensions with at least 40% data completeness
  const validDimensions = dimensions.filter((d) => d.dataCompleteness >= 40);
  const totalWeight = validDimensions.reduce((sum, d) => sum + d.weight, 0);
  const overallScore =
    totalWeight > 0
      ? validDimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight
      : 0;

  // Calculate overall data completeness
  const totalMetrics = dimensions.reduce((sum, d) => sum + d.metricsTotal, 0);
  const metricsWithData = dimensions.reduce((sum, d) => sum + d.metricsAvailable, 0);
  const dataCompleteness = totalMetrics > 0 ? (metricsWithData / totalMetrics) * 100 : 0;

  // Determine trend
  const trend = calculateTrend(overallScore, input.previousScore);

  // Identify strengths and improvements
  const sortedByScore = [...dimensions].sort((a, b) => b.score - a.score);
  const strengths = sortedByScore
    .slice(0, 3)
    .filter((d) => d.score >= 70)
    .map((d) => `${d.name} (${d.score.toFixed(0)}/100) - ${d.status === 'excellent' ? 'Excellent' : 'Performing well'}`);

  const improvements = sortedByScore
    .slice(-3)
    .reverse()
    .filter((d) => d.score < 70)
    .map((d) => {
      const issues = d.metrics
        .filter((m) => m.status === 'critical' || m.status === 'warning')
        .sort((a, b) => a.score - b.score)
        .slice(0, 2);

      if (issues.length > 0) {
        return `${d.name} (${d.score.toFixed(0)}/100) - ${issues.map((m) => m.name).join(', ')} need attention`;
      }
      return `${d.name} (${d.score.toFixed(0)}/100) - Needs improvement`;
    });

  // Generate recommendations
  const recommendations: string[] = [];

  // Pay equity recommendations
  const payEquityDim = dimensions.find((d) => d.dimension === 'pay_equity');
  if (payEquityDim && payEquityDim.score < 70) {
    const gapMetric = payEquityDim.metrics.find((m) => m.metricId === 'gender_pay_gap_median');
    if (gapMetric && gapMetric.value && gapMetric.value > 7) {
      recommendations.push(`Address gender pay gap (${gapMetric.formattedValue}) through compensation review`);
    }
  }

  // Team effectiveness recommendations
  const teamEffDim = dimensions.find((d) => d.dimension === 'team_effectiveness');
  if (teamEffDim) {
    const highSpan = teamEffDim.metrics.find((m) => m.metricId === 'high_span_managers');
    if (highSpan && highSpan.value && highSpan.value > 15) {
      recommendations.push(`Consider adding managers to reduce span of control (${highSpan.formattedValue} have >10 reports)`);
    }
  }

  // Financial efficiency recommendations
  const finEffDim = dimensions.find((d) => d.dimension === 'financial_efficiency');
  if (finEffDim && finEffDim.score < 70) {
    recommendations.push('Review department efficiency and revenue generation metrics');
  }

  // Summary statistics
  const summary = {
    excellentDimensions: dimensions.filter((d) => d.status === 'excellent').length,
    goodDimensions: dimensions.filter((d) => d.status === 'good').length,
    warningDimensions: dimensions.filter((d) => d.status === 'warning').length,
    criticalDimensions: dimensions.filter((d) => d.status === 'critical').length,
  };

  return {
    overallScore,
    grade: scoreToGrade(overallScore),
    status: scoreToStatus(overallScore),
    trend: trend.direction,
    trendChange: trend.change,
    dimensions,
    dataCompleteness,
    calculatedAt: new Date(),
    strengths,
    improvements,
    recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring key metrics and maintain current practices'],
    summary,
  };
}
