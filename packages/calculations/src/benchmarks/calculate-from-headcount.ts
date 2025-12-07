/**
 * Benchmark Calculation Utilities
 *
 * This module calculates all standard organizational metrics from raw department headcount data.
 * It ensures consistency between benchmark data and user data calculations.
 */

export interface DepartmentHeadcount {
  rd: number;
  gtm: number;
  ga: number;
  operations: number;
  other: number;
  total: number;
}

export interface PercentileHeadcount {
  p10?: DepartmentHeadcount;
  p25?: DepartmentHeadcount;
  p50: DepartmentHeadcount;  // Median is required
  p75?: DepartmentHeadcount;
  p90?: DepartmentHeadcount;
}

export interface CalculatedMetrics {
  // Structure metrics
  rd_to_gtm_ratio: number;
  gtm_to_rd_ratio: number;
  rd_percentage: number;
  gtm_percentage: number;
  ga_percentage: number;
  operations_percentage: number;
  other_percentage: number;

  // Headcount totals
  total_headcount: number;
  rd_headcount: number;
  gtm_headcount: number;
  ga_headcount: number;
  operations_headcount: number;
  other_headcount: number;
}

/**
 * Calculate all organizational metrics from a single percentile's department breakdown
 *
 * @param headcount - Department headcount for a specific percentile
 * @returns All calculated metrics for that percentile
 */
export function calculateMetricsFromHeadcount(headcount: DepartmentHeadcount): CalculatedMetrics {
  const { rd, gtm, ga, operations, other, total } = headcount;

  // Validate that total matches sum (with small tolerance for rounding)
  const sum = rd + gtm + ga + operations + other;
  if (Math.abs(sum - total) > 0.01) {
    console.warn(`Headcount mismatch: sum=${sum}, total=${total}`);
  }

  // Calculate ratios (handle division by zero)
  const rd_to_gtm_ratio = gtm > 0 ? rd / gtm : 0;
  const gtm_to_rd_ratio = rd > 0 ? gtm / rd : 0;

  // Calculate percentages
  const rd_percentage = total > 0 ? (rd / total) * 100 : 0;
  const gtm_percentage = total > 0 ? (gtm / total) * 100 : 0;
  const ga_percentage = total > 0 ? (ga / total) * 100 : 0;
  const operations_percentage = total > 0 ? (operations / total) * 100 : 0;
  const other_percentage = total > 0 ? (other / total) * 100 : 0;

  return {
    // Structure metrics
    rd_to_gtm_ratio: Number(rd_to_gtm_ratio.toFixed(2)),
    gtm_to_rd_ratio: Number(gtm_to_rd_ratio.toFixed(2)),
    rd_percentage: Number(rd_percentage.toFixed(1)),
    gtm_percentage: Number(gtm_percentage.toFixed(1)),
    ga_percentage: Number(ga_percentage.toFixed(1)),
    operations_percentage: Number(operations_percentage.toFixed(1)),
    other_percentage: Number(other_percentage.toFixed(1)),

    // Headcount totals
    total_headcount: total,
    rd_headcount: rd,
    gtm_headcount: gtm,
    ga_headcount: ga,
    operations_headcount: operations,
    other_headcount: other,
  };
}

/**
 * Calculate all organizational metrics across all percentiles
 *
 * @param percentileData - Department headcount for each percentile
 * @returns Percentile-based metrics for all calculated values
 */
export function calculateAllPercentilesFromHeadcount(percentileData: PercentileHeadcount): Record<string, any> {
  const result: Record<string, any> = {};

  // Process each percentile
  const percentiles = ['p10', 'p25', 'p50', 'p75', 'p90'] as const;

  percentiles.forEach((percentile) => {
    const headcount = percentileData[percentile];
    if (!headcount) return;

    const metrics = calculateMetricsFromHeadcount(headcount);

    // Store each metric with percentile suffix
    Object.entries(metrics).forEach(([metricName, value]) => {
      if (!result[metricName]) {
        result[metricName] = {};
      }
      result[metricName][percentile] = value;
    });
  });

  return result;
}

/**
 * Calculate efficiency metrics when revenue data is available
 *
 * @param percentileHeadcount - Department headcount for each percentile
 * @param percentileRevenue - Revenue for each percentile (same structure: { p10, p25, p50, p75, p90 })
 * @returns Efficiency metrics (revenue per FTE, etc.)
 */
export function calculateEfficiencyMetrics(
  percentileHeadcount: PercentileHeadcount,
  percentileRevenue: Record<string, number>
): Record<string, any> {
  const result: Record<string, any> = {};
  const percentiles = ['p10', 'p25', 'p50', 'p75', 'p90'] as const;

  percentiles.forEach((percentile) => {
    const headcount = percentileHeadcount[percentile];
    const revenue = percentileRevenue[percentile];

    if (!headcount || !revenue) return;

    // Revenue per FTE (total)
    const revenue_per_fte = headcount.total > 0 ? revenue / headcount.total : 0;

    // Revenue per R&D FTE
    const revenue_per_rd_fte = headcount.rd > 0 ? revenue / headcount.rd : 0;

    // Revenue per GTM FTE
    const revenue_per_gtm_fte = headcount.gtm > 0 ? revenue / headcount.gtm : 0;

    // Store metrics
    if (!result.revenue_per_fte) result.revenue_per_fte = {};
    if (!result.revenue_per_rd_fte) result.revenue_per_rd_fte = {};
    if (!result.revenue_per_gtm_fte) result.revenue_per_gtm_fte = {};

    result.revenue_per_fte[percentile] = Number(revenue_per_fte.toFixed(2));
    result.revenue_per_rd_fte[percentile] = Number(revenue_per_rd_fte.toFixed(2));
    result.revenue_per_gtm_fte[percentile] = Number(revenue_per_gtm_fte.toFixed(2));
  });

  return result;
}

/**
 * Validate department headcount data
 *
 * @param headcount - Department headcount to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateDepartmentHeadcount(headcount: DepartmentHeadcount): string[] {
  const errors: string[] = [];

  // Check all values are non-negative
  if (headcount.rd < 0) errors.push('R&D headcount cannot be negative');
  if (headcount.gtm < 0) errors.push('GTM headcount cannot be negative');
  if (headcount.ga < 0) errors.push('G&A headcount cannot be negative');
  if (headcount.operations < 0) errors.push('Operations headcount cannot be negative');
  if (headcount.other < 0) errors.push('Other headcount cannot be negative');
  if (headcount.total < 0) errors.push('Total headcount cannot be negative');

  // Check total matches sum
  const sum = headcount.rd + headcount.gtm + headcount.ga + headcount.operations + headcount.other;
  if (Math.abs(sum - headcount.total) > 0.01) {
    errors.push(`Total (${headcount.total}) does not match sum of departments (${sum})`);
  }

  // Check at least some headcount exists
  if (headcount.total === 0) {
    errors.push('Total headcount cannot be zero');
  }

  return errors;
}

/**
 * Validate percentile ordering for any metric
 *
 * @param percentileData - Object with percentile values (e.g., { p10: 10, p25: 15, p50: 20, p75: 30, p90: 40 })
 * @param metricName - Name of the metric being validated (for error messages)
 * @returns Array of validation error messages (empty if valid)
 */
export function validatePercentileOrdering(
  percentileData: Record<string, number | undefined>,
  metricName: string
): string[] {
  const errors: string[] = [];
  const percentiles = ['p10', 'p25', 'p50', 'p75', 'p90'];

  // Extract defined values in order
  const values: number[] = [];
  const labels: string[] = [];

  percentiles.forEach((p) => {
    const value = percentileData[p];
    if (value !== undefined && value !== null) {
      values.push(value);
      labels.push(p.toUpperCase());
    }
  });

  // Check ordering
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) {
      errors.push(`${metricName}: ${labels[i]} (${values[i]}) must be >= ${labels[i - 1]} (${values[i - 1]})`);
    }
  }

  return errors;
}

/**
 * Auto-calculate total headcount from department values
 *
 * @param rd - R&D headcount
 * @param gtm - GTM headcount
 * @param ga - G&A headcount
 * @param operations - Operations headcount
 * @param other - Other headcount
 * @returns Total headcount (sum of all departments)
 */
export function calculateTotalHeadcount(
  rd: number,
  gtm: number,
  ga: number,
  operations: number,
  other: number
): number {
  return rd + gtm + ga + operations + other;
}
