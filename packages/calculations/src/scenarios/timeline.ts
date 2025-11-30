// Timeline and financial planning calculations for scenarios

import type {
  AffectedEmployee,
  MonthlyBurnRate,
  RunwayAnalysis,
  YearEndProjection,
} from '@scleorg/types';

/**
 * Calculate monthly burn rate given a list of affected employees with effective dates
 */
export function calculateMonthlyBurnRate(
  baselineEmployees: any[],
  affectedEmployees: AffectedEmployee[],
  startMonth: Date,
  endMonth: Date
): MonthlyBurnRate[] {
  const months: MonthlyBurnRate[] = [];
  const current = new Date(startMonth);

  // Calculate baseline monthly cost (annual / 12)
  const baselineAnnualCost = baselineEmployees.reduce(
    (sum, emp) => sum + Number(emp.totalCompensation || 0),
    0
  );
  const baselineMonthlyCost = baselineAnnualCost / 12;

  while (current <= endMonth) {
    const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;

    // Calculate scenario cost for this month
    let scenarioCost = baselineMonthlyCost;
    let employeeCount = baselineEmployees.length;

    affectedEmployees.forEach((affectedEmp) => {
      const effectiveDate = affectedEmp.effectiveDate ? new Date(affectedEmp.effectiveDate) : null;

      if (!effectiveDate) return;

      const empMonthlyCost = affectedEmp.totalCompensation / 12;

      // Check if this employee's change is effective in this month
      const effectiveMonth = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), 1);
      const currentMonth = new Date(current.getFullYear(), current.getMonth(), 1);

      if (affectedEmp.action === 'remove' && effectiveMonth <= currentMonth) {
        scenarioCost -= empMonthlyCost;
        employeeCount -= 1;
      } else if (affectedEmp.action === 'add' && effectiveMonth <= currentMonth) {
        scenarioCost += empMonthlyCost;
        employeeCount += 1;
      }
    });

    months.push({
      month: monthKey,
      baselineCost: baselineMonthlyCost,
      scenarioCost,
      savings: baselineMonthlyCost - scenarioCost,
      effectiveEmployeeCount: employeeCount,
    });

    // Move to next month
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Calculate runway analysis given current cash and burn rates
 */
export function calculateRunwayAnalysis(
  currentCash: number | null,
  monthlyBurnRate: MonthlyBurnRate[]
): RunwayAnalysis {
  if (!currentCash || currentCash <= 0 || monthlyBurnRate.length === 0) {
    return {
      currentCash,
      baselineRunwayMonths: null,
      scenarioRunwayMonths: null,
      runwayExtensionMonths: null,
      baselineRunoutDate: null,
      scenarioRunoutDate: null,
    };
  }

  const avgBaselineBurn = monthlyBurnRate.reduce((sum, m) => sum + m.baselineCost, 0) / monthlyBurnRate.length;
  const avgScenarioBurn = monthlyBurnRate.reduce((sum, m) => sum + m.scenarioCost, 0) / monthlyBurnRate.length;

  const baselineRunwayMonths = avgBaselineBurn > 0 ? currentCash / avgBaselineBurn : null;
  const scenarioRunwayMonths = avgScenarioBurn > 0 ? currentCash / avgScenarioBurn : null;

  const runwayExtensionMonths = baselineRunwayMonths && scenarioRunwayMonths
    ? scenarioRunwayMonths - baselineRunwayMonths
    : null;

  const today = new Date();
  const baselineRunoutDate = baselineRunwayMonths
    ? new Date(today.getFullYear(), today.getMonth() + Math.floor(baselineRunwayMonths), 1)
    : null;
  const scenarioRunoutDate = scenarioRunwayMonths
    ? new Date(today.getFullYear(), today.getMonth() + Math.floor(scenarioRunwayMonths), 1)
    : null;

  return {
    currentCash,
    baselineRunwayMonths,
    scenarioRunwayMonths,
    runwayExtensionMonths,
    baselineRunoutDate,
    scenarioRunoutDate,
  };
}

/**
 * Calculate year-end projection
 */
export function calculateYearEndProjection(
  monthlyBurnRate: MonthlyBurnRate[]
): YearEndProjection {
  const today = new Date();
  const year = today.getFullYear();

  // Sum all months in current year
  const thisYearMonths = monthlyBurnRate.filter((m) => m.month.startsWith(String(year)));

  const baselineTotal = thisYearMonths.reduce((sum, m) => sum + m.baselineCost, 0);
  const scenarioTotal = thisYearMonths.reduce((sum, m) => sum + m.scenarioCost, 0);
  const totalSavings = baselineTotal - scenarioTotal;
  const avgMonthlyBurn = thisYearMonths.length > 0
    ? scenarioTotal / thisYearMonths.length
    : 0;

  return {
    year,
    baselineTotal,
    scenarioTotal,
    totalSavings,
    avgMonthlyBurn,
  };
}

/**
 * Generate default effective dates for affected employees
 */
export function generateDefaultEffectiveDates(
  affectedEmployees: AffectedEmployee[],
  startDate: Date = new Date()
): AffectedEmployee[] {
  return affectedEmployees.map((emp, index) => {
    if (emp.effectiveDate) return emp;

    // For removals: stagger 30 days apart starting 30 days from now
    // For additions: stagger 30 days apart starting 60 days from now
    const daysOffset = emp.action === 'remove'
      ? 30 + (index * 30)
      : 60 + (index * 30);

    const effectiveDate = new Date(startDate);
    effectiveDate.setDate(effectiveDate.getDate() + daysOffset);

    // Set to end of month
    effectiveDate.setMonth(effectiveDate.getMonth() + 1);
    effectiveDate.setDate(0);

    return {
      ...emp,
      effectiveDate,
    };
  });
}
