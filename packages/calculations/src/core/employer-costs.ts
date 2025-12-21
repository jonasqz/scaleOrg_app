// Employer cost calculation functions

export interface EmployerCostRecord {
  grossSalary: number;
  grossBonus?: number | null;
  grossEquity?: number | null;
  employerTaxes?: number | null;
  socialContributions?: number | null;
  healthInsurance?: number | null;
  benefits?: number | null;
  otherEmployerCosts?: number | null;
}

/**
 * Calculate gross total compensation (what employee receives)
 */
export function calculateGrossTotal(record: EmployerCostRecord): number {
  return (
    record.grossSalary +
    (record.grossBonus || 0) +
    (record.grossEquity || 0)
  );
}

/**
 * Calculate total employer cost (gross + employer-side costs)
 */
export function calculateTotalEmployerCost(record: EmployerCostRecord): number {
  const grossTotal = calculateGrossTotal(record);
  return (
    grossTotal +
    (record.employerTaxes || 0) +
    (record.socialContributions || 0) +
    (record.healthInsurance || 0) +
    (record.benefits || 0) +
    (record.otherEmployerCosts || 0)
  );
}

/**
 * Calculate employer cost ratio (total cost / gross compensation)
 * Example: 1.35 means 35% overhead on top of gross compensation
 */
export function calculateEmployerCostRatio(record: EmployerCostRecord): number {
  const grossTotal = calculateGrossTotal(record);
  if (grossTotal === 0) return 0;

  const totalCost = calculateTotalEmployerCost(record);
  return totalCost / grossTotal;
}

/**
 * Calculate employer overhead percentage (employer cost ratio - 1) * 100
 * Example: 35% means employer pays 35% more than gross compensation
 */
export function calculateEmployerOverhead(record: EmployerCostRecord): number {
  const ratio = calculateEmployerCostRatio(record);
  return (ratio - 1) * 100;
}

/**
 * Calculate average cost per employee from multiple records
 */
export function calculateAvgCostPerEmployee(records: EmployerCostRecord[]): number {
  if (records.length === 0) return 0;

  const totalCost = records.reduce(
    (sum, record) => sum + calculateTotalEmployerCost(record),
    0
  );

  return totalCost / records.length;
}

/**
 * Calculate month-over-month growth rate
 */
export function calculateMoMGrowthRate(currentCost: number, previousCost: number): number {
  if (previousCost === 0) return 0;
  return ((currentCost - previousCost) / previousCost) * 100;
}

/**
 * Calculate average monthly growth rate over a period
 */
export function calculateAvgMonthlyGrowthRate(
  firstMonthCost: number,
  lastMonthCost: number,
  monthsElapsed: number
): number {
  if (firstMonthCost === 0 || monthsElapsed === 0) return 0;

  const totalGrowth = (lastMonthCost - firstMonthCost) / firstMonthCost;
  return (totalGrowth / monthsElapsed) * 100;
}

/**
 * Project annual cost based on current monthly cost
 */
export function projectAnnualCost(monthlyCost: number): number {
  return monthlyCost * 12;
}

/**
 * Calculate total employer costs by category
 */
export function aggregateEmployerCosts(records: EmployerCostRecord[]): {
  totalGrossSalary: number;
  totalGrossBonus: number;
  totalGrossEquity: number;
  totalEmployerTaxes: number;
  totalSocialContributions: number;
  totalHealthInsurance: number;
  totalBenefits: number;
  totalOtherCosts: number;
  totalGrossCompensation: number;
  totalEmployerCost: number;
} {
  const aggregated = records.reduce(
    (acc, record) => ({
      totalGrossSalary: acc.totalGrossSalary + record.grossSalary,
      totalGrossBonus: acc.totalGrossBonus + (record.grossBonus || 0),
      totalGrossEquity: acc.totalGrossEquity + (record.grossEquity || 0),
      totalEmployerTaxes: acc.totalEmployerTaxes + (record.employerTaxes || 0),
      totalSocialContributions: acc.totalSocialContributions + (record.socialContributions || 0),
      totalHealthInsurance: acc.totalHealthInsurance + (record.healthInsurance || 0),
      totalBenefits: acc.totalBenefits + (record.benefits || 0),
      totalOtherCosts: acc.totalOtherCosts + (record.otherEmployerCosts || 0),
      totalGrossCompensation: 0, // Will calculate after
      totalEmployerCost: 0, // Will calculate after
    }),
    {
      totalGrossSalary: 0,
      totalGrossBonus: 0,
      totalGrossEquity: 0,
      totalEmployerTaxes: 0,
      totalSocialContributions: 0,
      totalHealthInsurance: 0,
      totalBenefits: 0,
      totalOtherCosts: 0,
      totalGrossCompensation: 0,
      totalEmployerCost: 0,
    }
  );

  // Calculate totals
  aggregated.totalGrossCompensation =
    aggregated.totalGrossSalary +
    aggregated.totalGrossBonus +
    aggregated.totalGrossEquity;

  aggregated.totalEmployerCost =
    aggregated.totalGrossCompensation +
    aggregated.totalEmployerTaxes +
    aggregated.totalSocialContributions +
    aggregated.totalHealthInsurance +
    aggregated.totalBenefits +
    aggregated.totalOtherCosts;

  return aggregated;
}
