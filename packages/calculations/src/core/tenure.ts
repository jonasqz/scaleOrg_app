// Tenure calculation functions

import type { Employee } from '@scleorg/types';

export interface TenureMetrics {
  avgTenureMonths: number;
  avgTenureYears: number;
  medianTenureMonths: number;
  tenureDistribution: {
    '0-6months': number;
    '6-12months': number;
    '1-2years': number;
    '2-5years': number;
    '5plus': number;
  };
  tenureByDepartment: {
    [department: string]: {
      avgMonths: number;
      avgYears: number;
      employeeCount: number;
    };
  };
  tenureByLevel: {
    [level: string]: {
      avgMonths: number;
      avgYears: number;
      employeeCount: number;
    };
  };
  retentionRisk: {
    high: Employee[];    // < 6 months
    medium: Employee[];  // 6-12 months
    low: Employee[];     // > 12 months
  };
}

/**
 * Calculate tenure in months for an employee
 */
export function calculateTenureMonths(startDate: Date | null): number | null {
  if (!startDate) return null;

  const start = new Date(startDate);
  const now = new Date();

  const yearsDiff = now.getFullYear() - start.getFullYear();
  const monthsDiff = now.getMonth() - start.getMonth();

  return yearsDiff * 12 + monthsDiff;
}

/**
 * Calculate all tenure-related metrics
 */
export function calculateTenureMetrics(employees: Employee[]): TenureMetrics | null {
  // Filter employees with start dates
  const employeesWithTenure = employees.filter(emp => emp.startDate);

  if (employeesWithTenure.length === 0) {
    return null;
  }

  // Calculate tenure for each employee
  const tenures = employeesWithTenure
    .map(emp => calculateTenureMonths(emp.startDate))
    .filter((t): t is number => t !== null)
    .sort((a, b) => a - b);

  if (tenures.length === 0) {
    return null;
  }

  // Average tenure
  const avgTenureMonths = tenures.reduce((sum, t) => sum + t, 0) / tenures.length;
  const avgTenureYears = avgTenureMonths / 12;

  // Median tenure
  const medianIndex = Math.floor(tenures.length / 2);
  const medianTenureMonths = tenures.length % 2 === 0
    ? (tenures[medianIndex - 1] + tenures[medianIndex]) / 2
    : tenures[medianIndex];

  // Tenure distribution
  const tenureDistribution = {
    '0-6months': tenures.filter(t => t < 6).length,
    '6-12months': tenures.filter(t => t >= 6 && t < 12).length,
    '1-2years': tenures.filter(t => t >= 12 && t < 24).length,
    '2-5years': tenures.filter(t => t >= 24 && t < 60).length,
    '5plus': tenures.filter(t => t >= 60).length,
  };

  // Tenure by department
  const tenureByDepartment: {
    [department: string]: { avgMonths: number; avgYears: number; employeeCount: number };
  } = {};

  employeesWithTenure.forEach(emp => {
    const dept = emp.department;
    const tenure = calculateTenureMonths(emp.startDate);

    if (tenure === null) return;

    if (!tenureByDepartment[dept]) {
      tenureByDepartment[dept] = {
        avgMonths: 0,
        avgYears: 0,
        employeeCount: 0,
      };
    }

    tenureByDepartment[dept].avgMonths += tenure;
    tenureByDepartment[dept].employeeCount += 1;
  });

  // Calculate averages for departments
  Object.keys(tenureByDepartment).forEach(dept => {
    const count = tenureByDepartment[dept].employeeCount;
    tenureByDepartment[dept].avgMonths = tenureByDepartment[dept].avgMonths / count;
    tenureByDepartment[dept].avgYears = tenureByDepartment[dept].avgMonths / 12;
  });

  // Tenure by level
  const tenureByLevel: {
    [level: string]: { avgMonths: number; avgYears: number; employeeCount: number };
  } = {};

  employeesWithTenure.forEach(emp => {
    const level = emp.level || 'Unknown';
    const tenure = calculateTenureMonths(emp.startDate);

    if (tenure === null) return;

    if (!tenureByLevel[level]) {
      tenureByLevel[level] = {
        avgMonths: 0,
        avgYears: 0,
        employeeCount: 0,
      };
    }

    tenureByLevel[level].avgMonths += tenure;
    tenureByLevel[level].employeeCount += 1;
  });

  // Calculate averages for levels
  Object.keys(tenureByLevel).forEach(level => {
    const count = tenureByLevel[level].employeeCount;
    tenureByLevel[level].avgMonths = tenureByLevel[level].avgMonths / count;
    tenureByLevel[level].avgYears = tenureByLevel[level].avgMonths / 12;
  });

  // Retention risk analysis
  const retentionRisk = {
    high: employeesWithTenure.filter(emp => {
      const tenure = calculateTenureMonths(emp.startDate);
      return tenure !== null && tenure < 6;
    }),
    medium: employeesWithTenure.filter(emp => {
      const tenure = calculateTenureMonths(emp.startDate);
      return tenure !== null && tenure >= 6 && tenure < 12;
    }),
    low: employeesWithTenure.filter(emp => {
      const tenure = calculateTenureMonths(emp.startDate);
      return tenure !== null && tenure >= 12;
    }),
  };

  return {
    avgTenureMonths,
    avgTenureYears,
    medianTenureMonths,
    tenureDistribution,
    tenureByDepartment,
    tenureByLevel,
    retentionRisk,
  };
}

/**
 * Format tenure in a human-readable way
 */
export function formatTenure(months: number): string {
  if (months < 1) return 'Less than 1 month';
  if (months === 1) return '1 month';
  if (months < 12) return `${Math.floor(months)} months`;

  const years = Math.floor(months / 12);
  const remainingMonths = Math.floor(months % 12);

  if (remainingMonths === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }

  return `${years}y ${remainingMonths}m`;
}
