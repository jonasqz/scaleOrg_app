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

  // For each future month, recalculate planned compensation
  for (const month of monthsToSync) {
    const monthStr = month.toISOString().split('T')[0];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const periodLabel = `${monthNames[month.getMonth()]} ${month.getFullYear()}`;

    // Calculate total planned compensation for this month
    // This is the sum of all active employees' monthly costs
    const totalPlanned = employees.reduce((sum, emp) => {
      // Check if employee will be active in this month
      const startDate = emp.startDate ? new Date(emp.startDate) : null;
      const endDate = emp.endDate ? new Date(emp.endDate) : null;

      // Skip if employee hasn't started yet
      if (startDate && startDate > month) {
        return sum;
      }

      // Skip if employee has already left
      if (endDate && endDate < month) {
        return sum;
      }

      // Monthly cost = annual compensation / 12
      const monthlyCost = Number(emp.totalCompensation) / 12;
      return sum + monthlyCost;
    }, 0);

    // Check if this month already has a record
    const existingRecord = await prisma.monthlyPlannedCompensation.findUnique({
      where: {
        datasetId_period: {
          datasetId,
          period: month,
        },
      },
    });

    if (existingRecord) {
      // Update only if:
      // 1. No manual override exists, OR
      // 2. Actual hasn't been entered yet (month is still in future/current)
      const shouldUpdate = !existingRecord.isManualOverride && !existingRecord.actualEmployerCost;

      if (shouldUpdate) {
        await prisma.monthlyPlannedCompensation.update({
          where: {
            datasetId_period: {
              datasetId,
              period: month,
            },
          },
          data: {
            plannedEmployerCost: new Prisma.Decimal(totalPlanned),
            activeEmployeeCount: employees.length,
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
          plannedEmployerCost: new Prisma.Decimal(totalPlanned),
          actualEmployerCost: null,
          activeEmployeeCount: employees.length,
          isManualOverride: false,
        },
      });
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
