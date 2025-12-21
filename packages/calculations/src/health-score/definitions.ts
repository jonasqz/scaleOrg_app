/**
 * Health Score Dimension Definitions
 *
 * Defines the 6 dimensions of organizational health and their constituent metrics
 */

import type { DimensionDefinition, ScoringRule } from './types';

/**
 * Financial Efficiency Dimension (20% weight)
 *
 * Measures how efficiently the organization converts headcount into revenue
 * and manages compensation costs relative to revenue
 */
const FINANCIAL_EFFICIENCY_METRICS: ScoringRule[] = [
  {
    metricId: 'revenue_per_employee',
    name: 'Revenue per Employee',
    description: 'Total revenue divided by total headcount',
    dimension: 'financial_efficiency',
    weight: 0.30,
    unit: 'currency',
    scoringType: 'benchmark',
    benchmarkKey: 'revenue_per_employee',
  },
  {
    metricId: 'personnel_cost_pct_revenue',
    name: 'Personnel Cost as % of Revenue',
    description: 'Total personnel costs as percentage of revenue',
    dimension: 'financial_efficiency',
    weight: 0.25,
    unit: 'percentage',
    scoringType: 'benchmark',
    benchmarkKey: 'personnel_cost_pct_revenue',
    invertScore: true, // Lower is better
  },
  {
    metricId: 'salary_cost_pct_revenue',
    name: 'Salary Cost as % of Revenue',
    description: 'Total salary costs as percentage of revenue',
    dimension: 'financial_efficiency',
    weight: 0.20,
    unit: 'percentage',
    scoringType: 'benchmark',
    benchmarkKey: 'salary_cost_pct_revenue',
    invertScore: true,
  },
  {
    metricId: 'eng_revenue_per_fte',
    name: 'Engineering Revenue Efficiency',
    description: 'Revenue per engineering FTE',
    dimension: 'financial_efficiency',
    weight: 0.15,
    unit: 'currency',
    scoringType: 'benchmark',
    benchmarkKey: 'revenue_per_eng',
  },
  {
    metricId: 'sales_revenue_per_fte',
    name: 'Sales Revenue Efficiency',
    description: 'Revenue per sales FTE',
    dimension: 'financial_efficiency',
    weight: 0.10,
    unit: 'currency',
    scoringType: 'benchmark',
    benchmarkKey: 'revenue_per_sales',
  },
];

/**
 * Organizational Structure Dimension (20% weight)
 *
 * Evaluates the balance and efficiency of team structures and reporting relationships
 */
const ORGANIZATIONAL_STRUCTURE_METRICS: ScoringRule[] = [
  {
    metricId: 'rd_to_gtm_ratio',
    name: 'R&D to GTM Ratio',
    description: 'Ratio of R&D to Go-to-Market headcount',
    dimension: 'organizational_structure',
    weight: 0.30,
    unit: 'ratio',
    scoringType: 'benchmark',
    benchmarkKey: 'rd_to_gtm_ratio',
  },
  {
    metricId: 'span_of_control',
    name: 'Span of Control',
    description: 'Average number of direct reports per manager',
    dimension: 'organizational_structure',
    weight: 0.25,
    unit: 'ratio',
    scoringType: 'threshold',
    thresholds: {
      excellent: { min: 5, max: 8 },
      good: { min: 4, max: 10 },
      warning: { min: 3, max: 12 },
      critical: { min: 0, max: 15 },
    },
  },
  {
    metricId: 'manager_to_ic_ratio',
    name: 'Manager to IC Ratio',
    description: 'Ratio of managers to individual contributors',
    dimension: 'organizational_structure',
    weight: 0.20,
    unit: 'ratio',
    scoringType: 'threshold',
    thresholds: {
      excellent: { min: 0.10, max: 0.20 },
      good: { min: 0.08, max: 0.25 },
      warning: { min: 0.05, max: 0.30 },
      critical: { min: 0, max: 0.40 },
    },
  },
  {
    metricId: 'eng_pct_employees',
    name: 'Engineering as % of Employees',
    description: 'Engineering headcount as percentage of total employees',
    dimension: 'organizational_structure',
    weight: 0.15,
    unit: 'percentage',
    scoringType: 'benchmark',
    benchmarkKey: 'eng_pct_employees',
  },
  {
    metricId: 'department_balance',
    name: 'Department Balance',
    description: 'Balance across key departments',
    dimension: 'organizational_structure',
    weight: 0.10,
    unit: 'ratio',
    scoringType: 'custom',
    customScore: (value: number) => {
      // Custom scoring based on department distribution variance
      // Lower variance = better balance = higher score
      if (value < 0.15) return 100;
      if (value < 0.25) return 80;
      if (value < 0.35) return 60;
      if (value < 0.50) return 40;
      return 20;
    },
  },
];

/**
 * Talent & Retention Dimension (15% weight)
 *
 * Measures employee stability and talent management effectiveness
 */
const TALENT_RETENTION_METRICS: ScoringRule[] = [
  {
    metricId: 'employee_tenure',
    name: 'Average Employee Tenure',
    description: 'Average years of service for current employees',
    dimension: 'talent_retention',
    weight: 0.30,
    unit: 'years',
    scoringType: 'benchmark',
    benchmarkKey: 'employee_tenure',
  },
  {
    metricId: 'turnover_pct',
    name: 'Turnover Rate',
    description: 'Employee departures as percentage of total employees',
    dimension: 'talent_retention',
    weight: 0.30,
    unit: 'percentage',
    scoringType: 'benchmark',
    benchmarkKey: 'turnover_pct',
    invertScore: true,
  },
  {
    metricId: 'new_hires_pct',
    name: 'New Hire Rate',
    description: 'New hires as percentage of total employees',
    dimension: 'talent_retention',
    weight: 0.20,
    unit: 'percentage',
    scoringType: 'benchmark',
    benchmarkKey: 'new_hires_pct',
  },
  {
    metricId: 'location_distribution',
    name: 'Geographic Distribution',
    description: 'Balance between high and low cost countries',
    dimension: 'talent_retention',
    weight: 0.20,
    unit: 'ratio',
    scoringType: 'threshold',
    thresholds: {
      excellent: { min: 0.3, max: 0.7 }, // 30-70% in high cost countries
      good: { min: 0.2, max: 0.8 },
      warning: { min: 0.1, max: 0.9 },
      critical: { min: 0, max: 1.0 },
    },
  },
];

/**
 * Pay Equity & Fairness Dimension (15% weight)
 *
 * Evaluates compensation fairness and alignment with market benchmarks
 */
const PAY_EQUITY_METRICS: ScoringRule[] = [
  {
    metricId: 'gender_pay_gap_median',
    name: 'Gender Pay Gap (Median)',
    description: 'Median pay gap between male and female employees',
    dimension: 'pay_equity',
    weight: 0.30,
    unit: 'percentage',
    scoringType: 'threshold',
    invertScore: true,
    thresholds: {
      excellent: { min: 0, max: 3 }, // 0-3% gap
      good: { min: 0, max: 7 },
      warning: { min: 0, max: 12 },
      critical: { min: 0, max: 100 },
    },
  },
  {
    metricId: 'gender_pay_gap_mean',
    name: 'Gender Pay Gap (Mean)',
    description: 'Mean pay gap between male and female employees',
    dimension: 'pay_equity',
    weight: 0.20,
    unit: 'percentage',
    scoringType: 'threshold',
    invertScore: true,
    thresholds: {
      excellent: { min: 0, max: 3 },
      good: { min: 0, max: 7 },
      warning: { min: 0, max: 12 },
      critical: { min: 0, max: 100 },
    },
  },
  {
    metricId: 'internal_pay_equity',
    name: 'Internal Pay Equity',
    description: 'Ratio of 90th to 10th percentile compensation',
    dimension: 'pay_equity',
    weight: 0.25,
    unit: 'ratio',
    scoringType: 'threshold',
    invertScore: true,
    thresholds: {
      excellent: { min: 1, max: 3 }, // 3x spread
      good: { min: 1, max: 4 },
      warning: { min: 1, max: 6 },
      critical: { min: 1, max: 10 },
    },
  },
  {
    metricId: 'benchmark_alignment',
    name: 'Market Benchmark Alignment',
    description: 'Percentage of roles within benchmark range',
    dimension: 'pay_equity',
    weight: 0.25,
    unit: 'percentage',
    scoringType: 'threshold',
    thresholds: {
      excellent: { min: 80, max: 100 },
      good: { min: 60, max: 79 },
      warning: { min: 40, max: 59 },
      critical: { min: 0, max: 39 },
    },
  },
];

/**
 * Team Effectiveness Dimension (15% weight)
 *
 * Measures team productivity and management effectiveness
 */
const TEAM_EFFECTIVENESS_METRICS: ScoringRule[] = [
  {
    metricId: 'low_span_managers',
    name: 'Low Span Managers',
    description: 'Percentage of managers with <5 direct reports',
    dimension: 'team_effectiveness',
    weight: 0.30,
    unit: 'percentage',
    scoringType: 'threshold',
    invertScore: true,
    thresholds: {
      excellent: { min: 0, max: 10 }, // <10% have low span
      good: { min: 0, max: 20 },
      warning: { min: 0, max: 35 },
      critical: { min: 0, max: 100 },
    },
  },
  {
    metricId: 'high_span_managers',
    name: 'High Span Managers',
    description: 'Percentage of managers with >10 direct reports',
    dimension: 'team_effectiveness',
    weight: 0.30,
    unit: 'percentage',
    scoringType: 'threshold',
    invertScore: true,
    thresholds: {
      excellent: { min: 0, max: 5 },
      good: { min: 0, max: 15 },
      warning: { min: 0, max: 25 },
      critical: { min: 0, max: 100 },
    },
  },
  {
    metricId: 'dept_revenue_efficiency',
    name: 'Department Revenue Efficiency',
    description: 'Average department revenue per FTE performance',
    dimension: 'team_effectiveness',
    weight: 0.25,
    unit: 'ratio',
    scoringType: 'custom',
    customScore: (value: number) => {
      // Value is average % of departments meeting benchmark
      return Math.min(100, Math.max(0, value));
    },
  },
  {
    metricId: 'management_overhead',
    name: 'Management Overhead',
    description: 'Management as % of total employees',
    dimension: 'team_effectiveness',
    weight: 0.15,
    unit: 'percentage',
    scoringType: 'threshold',
    thresholds: {
      excellent: { min: 10, max: 20 },
      good: { min: 8, max: 25 },
      warning: { min: 5, max: 30 },
      critical: { min: 0, max: 40 },
    },
  },
];

/**
 * Cost Management Dimension (15% weight)
 *
 * Evaluates cost control and financial planning effectiveness
 */
const COST_MANAGEMENT_METRICS: ScoringRule[] = [
  {
    metricId: 'employer_cost_ratio',
    name: 'Employer Cost Ratio',
    description: 'Total employer costs relative to gross compensation',
    dimension: 'cost_management',
    weight: 0.25,
    unit: 'factor',
    scoringType: 'threshold',
    invertScore: true,
    thresholds: {
      excellent: { min: 1.0, max: 1.25 }, // 25% overhead
      good: { min: 1.0, max: 1.35 },
      warning: { min: 1.0, max: 1.45 },
      critical: { min: 1.0, max: 2.0 },
    },
  },
  {
    metricId: 'monthly_cost_growth',
    name: 'Monthly Cost Growth Rate',
    description: 'Average monthly cost increase',
    dimension: 'cost_management',
    weight: 0.25,
    unit: 'percentage',
    scoringType: 'threshold',
    invertScore: true,
    thresholds: {
      excellent: { min: -5, max: 5 }, // -5% to +5%
      good: { min: -10, max: 10 },
      warning: { min: -15, max: 15 },
      critical: { min: -50, max: 30 },
    },
  },
  {
    metricId: 'cost_per_employee_trend',
    name: 'Cost per Employee Trend',
    description: 'Trend in average cost per employee',
    dimension: 'cost_management',
    weight: 0.20,
    unit: 'percentage',
    scoringType: 'threshold',
    invertScore: true,
    thresholds: {
      excellent: { min: -3, max: 3 },
      good: { min: -5, max: 7 },
      warning: { min: -10, max: 12 },
      critical: { min: -20, max: 20 },
    },
  },
  {
    metricId: 'budget_variance',
    name: 'Budget Variance',
    description: 'Actual vs planned compensation variance',
    dimension: 'cost_management',
    weight: 0.15,
    unit: 'percentage',
    scoringType: 'threshold',
    invertScore: true,
    thresholds: {
      excellent: { min: 0, max: 5 },
      good: { min: 0, max: 10 },
      warning: { min: 0, max: 15 },
      critical: { min: 0, max: 100 },
    },
  },
  {
    metricId: 'runway_months',
    name: 'Cash Runway',
    description: 'Months of cash runway at current burn rate',
    dimension: 'cost_management',
    weight: 0.15,
    unit: 'count',
    scoringType: 'threshold',
    thresholds: {
      excellent: { min: 18, max: 100 },
      good: { min: 12, max: 17 },
      warning: { min: 6, max: 11 },
      critical: { min: 0, max: 5 },
    },
  },
];

/**
 * All dimension definitions
 */
export const DIMENSION_DEFINITIONS: DimensionDefinition[] = [
  {
    id: 'financial_efficiency',
    name: 'Financial Efficiency',
    description: 'Revenue generation efficiency and cost-to-revenue ratios',
    weight: 0.20,
    metrics: FINANCIAL_EFFICIENCY_METRICS,
  },
  {
    id: 'organizational_structure',
    name: 'Organizational Structure',
    description: 'Team composition balance and reporting structure health',
    weight: 0.20,
    metrics: ORGANIZATIONAL_STRUCTURE_METRICS,
  },
  {
    id: 'talent_retention',
    name: 'Talent & Retention',
    description: 'Employee stability and tenure metrics',
    weight: 0.15,
    metrics: TALENT_RETENTION_METRICS,
  },
  {
    id: 'pay_equity',
    name: 'Pay Equity & Fairness',
    description: 'Compensation fairness and market alignment',
    weight: 0.15,
    metrics: PAY_EQUITY_METRICS,
  },
  {
    id: 'team_effectiveness',
    name: 'Team Effectiveness',
    description: 'Management effectiveness and team productivity',
    weight: 0.15,
    metrics: TEAM_EFFECTIVENESS_METRICS,
  },
  {
    id: 'cost_management',
    name: 'Cost Management',
    description: 'Cost control and financial planning effectiveness',
    weight: 0.15,
    metrics: COST_MANAGEMENT_METRICS,
  },
];

/**
 * Get dimension definition by ID
 */
export function getDimensionDefinition(dimensionId: string): DimensionDefinition | undefined {
  return DIMENSION_DEFINITIONS.find((d) => d.id === dimensionId);
}

/**
 * Get all metric definitions across all dimensions
 */
export function getAllMetricDefinitions(): ScoringRule[] {
  return DIMENSION_DEFINITIONS.flatMap((d) => d.metrics);
}

/**
 * Get metric definition by ID
 */
export function getMetricDefinition(metricId: string): ScoringRule | undefined {
  return getAllMetricDefinitions().find((m) => m.metricId === metricId);
}
