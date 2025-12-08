import { prisma } from '@scleorg/database';
import { Prisma } from '@scleorg/database';

/**
 * Synchronizes MonthlyPlannedCompensation records for all future months
 * based on current employee data.
 *
 * This ensures that when employees are added/updated/deleted,
 * the compensation tracking reflects those changes immediately.
 */
export async function syncPlannedCompensation(datasetId: string): Promise<void> {
  // Get all active employees for this dataset
  const employees = await prisma.employee.findMany({
    where: {
      datasetId,
      endDate: null, // Only active employees
    },
  });

  // Determine current month and generate next 12 months
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthsToSync: Date[] = [];
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(currentMonth);
    monthDate.setMonth(currentMonth.getMonth() + i);
    monthsToSync.push(monthDate);
  }

  // For each future month, sync planned compensation for each employee
  for (const month of monthsToSync) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const periodLabel = `${monthNames[month.getMonth()]} ${month.getFullYear()}`;

    // For each active employee, create/update their planned compensation
    for (const employee of employees) {
      // Check if employee will be active in this month
      const startDate = employee.startDate ? new Date(employee.startDate) : null;
      const endDate = employee.endDate ? new Date(employee.endDate) : null;

      // Skip if employee hasn't started yet or has already left
      if ((startDate && startDate > month) || (endDate && endDate < month)) {
        continue;
      }

      // Calculate monthly planned compensation
      const annualSalary = Number(employee.annualSalary || 0);
      const bonus = Number(employee.bonus || 0);
      const equityValue = Number(employee.equityValue || 0);

      const plannedGrossSalary = new Prisma.Decimal(annualSalary / 12);
      const plannedGrossBonus = bonus > 0 ? new Prisma.Decimal(bonus / 12) : null;
      const plannedGrossEquity = equityValue > 0 ? new Prisma.Decimal(equityValue / 12) : null;
      const plannedGrossTotal = new Prisma.Decimal((annualSalary + bonus + equityValue) / 12);

      // Estimate employer costs (rough estimates - can be improved)
      const grossTotal = (annualSalary + bonus + equityValue) / 12;
      const employerTaxRate = 0.20; // 20% rough estimate
      const plannedTotalEmployerCost = new Prisma.Decimal(grossTotal * (1 + employerTaxRate));

      // Check if this employee already has a record for this month
      const existingRecord = await prisma.monthlyPlannedCompensation.findUnique({
        where: {
          datasetId_period_employeeId: {
            datasetId,
            period: month,
            employeeId: employee.id,
          },
        },
      });

      if (existingRecord) {
        // Update only if not manually overridden
        if (!existingRecord.isManualOverride) {
          await prisma.monthlyPlannedCompensation.update({
            where: {
              datasetId_period_employeeId: {
                datasetId,
                period: month,
                employeeId: employee.id,
              },
            },
            data: {
              plannedGrossSalary,
              plannedGrossBonus,
              plannedGrossEquity,
              plannedGrossTotal,
              plannedTotalEmployerCost,
              currency: employee.currency || 'EUR',
            },
          });
        }
      } else {
        // Create new record
        await prisma.monthlyPlannedCompensation.create({
          data: {
            datasetId,
            period: month,
            periodLabel,
            employeeId: employee.id,
            plannedGrossSalary,
            plannedGrossBonus,
            plannedGrossEquity,
            plannedGrossTotal,
            plannedTotalEmployerCost,
            isManualOverride: false,
            currency: employee.currency || 'EUR',
          },
        });
      }
    }
  }
}

/**
 * Validates employee data before create/update
 */
export function validateEmployeeData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!data.department || data.department.trim() === '') {
    errors.push('Department is required');
  }

  if (!data.totalCompensation || data.totalCompensation <= 0) {
    errors.push('Total compensation must be greater than 0');
  }

  // Validate FTE factor
  if (data.fteFactor !== undefined && (data.fteFactor <= 0 || data.fteFactor > 1)) {
    errors.push('FTE factor must be between 0 and 1');
  }

  // Validate dates
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      errors.push('End date cannot be before start date');
    }
  }

  // Validate numeric fields are not negative
  if (data.annualSalary !== undefined && data.annualSalary < 0) {
    errors.push('Annual salary cannot be negative');
  }

  if (data.bonus !== undefined && data.bonus < 0) {
    errors.push('Bonus cannot be negative');
  }

  if (data.equityValue !== undefined && data.equityValue < 0) {
    errors.push('Equity value cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
