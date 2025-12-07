import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

// Helper to generate month labels
function generateMonths(startOffset: number, count: number) {
  const months = [];
  const now = new Date();

  for (let i = startOffset; i < startOffset + count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.push({
      period: date.toISOString().split('T')[0],
      label: `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`,
      fullLabel: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
      isPast: i < 0,
      isCurrent: i === 0,
      isFuture: i > 0,
    });
  }

  return months;
}

// Helper to calculate employer cost ratio based on historical data or default
async function getAverageEmployerCostRatio(datasetId: string): Promise<number> {
  const recentCosts = await prisma.monthlyEmployerCost.findMany({
    where: { datasetId },
    orderBy: { period: 'desc' },
    take: 6,
  });

  if (recentCosts.length > 0) {
    const avgRatio = recentCosts.reduce((sum, cost) =>
      sum + (cost.employerCostRatio ? Number(cost.employerCostRatio) : 0), 0
    ) / recentCosts.length;
    return avgRatio > 0 ? avgRatio : 1.35; // Default to 1.35 if no data
  }

  return 1.35; // Default 35% overhead
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

    // Verify dataset ownership
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        employees: {
          where: { endDate: null },
          orderBy: [{ department: 'asc' }, { employeeName: 'asc' }],
        },
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Generate 24 months (12 past + current + 11 future)
    const months = generateMonths(-12, 24);

    // Fetch all actual costs for the period
    const actualCosts = await prisma.monthlyEmployerCost.findMany({
      where: {
        datasetId: id,
        period: {
          gte: new Date(months[0].period),
          lte: new Date(months[months.length - 1].period),
        },
      },
    });

    // Fetch all planned costs (manual overrides)
    const plannedCosts = await prisma.monthlyPlannedCompensation.findMany({
      where: {
        datasetId: id,
        period: {
          gte: new Date(months[0].period),
          lte: new Date(months[months.length - 1].period),
        },
      },
    });

    // Fetch revenue data
    const revenues = await prisma.monthlyRevenue.findMany({
      where: {
        datasetId: id,
        period: {
          gte: new Date(months[0].period),
          lte: new Date(months[months.length - 1].period),
        },
      },
    });

    // Get average employer cost ratio for planning
    const avgEmployerCostRatio = await getAverageEmployerCostRatio(id);

    // Debug logging
    console.log('Dataset employees count:', dataset.employees.length);
    console.log('Months generated:', months.length);
    console.log('Average employer cost ratio:', avgEmployerCostRatio);

    // Build data structure by employee and month
    const employeeData = dataset.employees.map(employee => {
      const monthlyData = months.map(month => {
        const monthKey = month.period;

        // Find actual cost for this employee/month
        const actual = actualCosts.find(
          c => c.employeeId === employee.id && c.period.toISOString().split('T')[0] === monthKey
        );

        // Find planned cost (manual override)
        const plannedOverride = plannedCosts.find(
          c => c.employeeId === employee.id && c.period.toISOString().split('T')[0] === monthKey
        );

        // Calculate planned (use override if exists, otherwise auto-calculate)
        let plannedGrossTotal: number;
        let plannedTotalEmployerCost: number;
        let isManualOverride = false;

        if (plannedOverride) {
          plannedGrossTotal = Number(plannedOverride.plannedGrossTotal);
          plannedTotalEmployerCost = Number(plannedOverride.plannedTotalEmployerCost);
          isManualOverride = plannedOverride.isManualOverride;
        } else {
          // Auto-calculate from employee record
          const monthlySalary = employee.annualSalary ? Number(employee.annualSalary) / 12 : 0;
          const monthlyBonus = employee.bonus ? Number(employee.bonus) / 12 : 0;
          const monthlyEquity = employee.equityValue ? Number(employee.equityValue) / 12 : 0;

          plannedGrossTotal = monthlySalary + monthlyBonus + monthlyEquity;
          plannedTotalEmployerCost = plannedGrossTotal * avgEmployerCostRatio;
        }

        // Calculate actual
        const actualGrossTotal = actual ? Number(actual.grossTotal) : null;
        const actualTotalEmployerCost = actual ? Number(actual.totalEmployerCost) : null;

        // Calculate variance
        const variance = actualTotalEmployerCost !== null
          ? actualTotalEmployerCost - plannedTotalEmployerCost
          : null;

        const variancePercent = variance !== null && plannedTotalEmployerCost > 0
          ? (variance / plannedTotalEmployerCost) * 100
          : null;

        return {
          month: monthKey,
          label: month.label,
          isPast: month.isPast,
          isCurrent: month.isCurrent,
          isFuture: month.isFuture,
          planned: {
            grossTotal: plannedGrossTotal,
            totalEmployerCost: plannedTotalEmployerCost,
            isManualOverride,
          },
          actual: {
            grossTotal: actualGrossTotal,
            totalEmployerCost: actualTotalEmployerCost,
          },
          variance: {
            amount: variance,
            percent: variancePercent,
          },
        };
      });

      return {
        employeeId: employee.id,
        employeeName: employee.employeeName || 'Unnamed',
        department: employee.department,
        monthlyData,
      };
    });

    // Group by department
    const departmentMap = new Map<string, typeof employeeData>();
    employeeData.forEach(emp => {
      const dept = emp.department;
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, []);
      }
      departmentMap.get(dept)!.push(emp);
    });

    console.log('Employee data count:', employeeData.length);
    console.log('Department map size:', departmentMap.size);
    console.log('Departments:', Array.from(departmentMap.keys()));

    const departments = Array.from(departmentMap.entries()).map(([dept, employees]) => ({
      department: dept,
      employees,
      // Calculate department totals for each month
      monthlyTotals: months.map((month, idx) => {
        const planned = employees.reduce((sum, emp) =>
          sum + emp.monthlyData[idx].planned.totalEmployerCost, 0
        );
        const actual = employees.reduce((sum, emp) =>
          sum + (emp.monthlyData[idx].actual.totalEmployerCost || 0), 0
        );
        const variance = actual > 0 ? actual - planned : null;

        return {
          month: month.period,
          label: month.label,
          planned,
          actual: actual > 0 ? actual : null,
          variance,
          variancePercent: variance !== null && planned > 0 ? (variance / planned) * 100 : null,
        };
      }),
    }));

    // Calculate company-wide summary for each month
    const monthlySummary = months.map((month, idx) => {
      const planned = employeeData.reduce((sum, emp) =>
        sum + emp.monthlyData[idx].planned.totalEmployerCost, 0
      );
      const actual = employeeData.reduce((sum, emp) =>
        sum + (emp.monthlyData[idx].actual.totalEmployerCost || 0), 0
      );
      const variance = actual > 0 ? actual - planned : null;

      // Find revenue for this month
      const revenue = revenues.find(r =>
        r.period.toISOString().split('T')[0] === month.period
      );

      return {
        month: month.period,
        label: month.label,
        fullLabel: month.fullLabel,
        isPast: month.isPast,
        isCurrent: month.isCurrent,
        isFuture: month.isFuture,
        planned,
        actual: actual > 0 ? actual : null,
        variance,
        variancePercent: variance !== null && planned > 0 ? (variance / planned) * 100 : null,
        revenue: revenue ? Number(revenue.revenue) : null,
      };
    });

    // Calculate overall metrics
    const currentMonth = monthlySummary.find(m => m.isCurrent);
    const pastMonths = monthlySummary.filter(m => m.isPast && m.actual !== null);

    const avgMonthlyBurn = pastMonths.length > 0
      ? pastMonths.reduce((sum, m) => sum + (m.actual || 0), 0) / pastMonths.length
      : (currentMonth?.planned || 0);

    const runway = dataset.currentCashBalance && avgMonthlyBurn > 0
      ? Number(dataset.currentCashBalance) / avgMonthlyBurn
      : null;

    const totalVariance = pastMonths.reduce((sum, m) => sum + (m.variance || 0), 0);
    const avgVariancePercent = pastMonths.length > 0
      ? pastMonths.reduce((sum, m) => sum + (m.variancePercent || 0), 0) / pastMonths.length
      : 0;

    const response = {
      departments,
      monthlySummary,
      summary: {
        currentMonthBurn: currentMonth?.actual || currentMonth?.planned || 0,
        avgMonthlyBurn,
        runway,
        totalVariance,
        avgVariancePercent,
        cashBalance: dataset.currentCashBalance ? Number(dataset.currentCashBalance) : null,
        employeeCount: dataset.employees.length,
      },
      months: months.map(m => ({ period: m.period, label: m.label, fullLabel: m.fullLabel })),
    };

    console.log('Final response summary:', {
      departmentCount: departments.length,
      monthlySummaryCount: monthlySummary.length,
      monthsCount: months.length,
      employeeCount: dataset.employees.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Compensation planning error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compensation planning data' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

    // Verify dataset ownership
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const body = await request.json();
    const { employeeId, period, plannedTotalEmployerCost } = body;

    if (!employeeId || !period || plannedTotalEmployerCost === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get employee to calculate breakdown
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        datasetId: id,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get average employer cost ratio
    const avgEmployerCostRatio = await getAverageEmployerCostRatio(id);

    // Calculate gross total from employer cost
    const plannedGrossTotal = plannedTotalEmployerCost / avgEmployerCostRatio;

    // Use employee's compensation structure to break down
    const totalComp = Number(employee.totalCompensation);
    const annualSalary = employee.annualSalary ? Number(employee.annualSalary) : totalComp * 0.7;
    const bonus = employee.bonus ? Number(employee.bonus) : totalComp * 0.2;
    const equity = employee.equityValue ? Number(employee.equityValue) : totalComp * 0.1;

    const salaryRatio = annualSalary / totalComp;
    const bonusRatio = bonus / totalComp;
    const equityRatio = equity / totalComp;

    const plannedGrossSalary = plannedGrossTotal * salaryRatio;
    const plannedGrossBonus = plannedGrossTotal * bonusRatio;
    const plannedGrossEquity = plannedGrossTotal * equityRatio;

    // Calculate employer costs
    const employerCostAmount = plannedTotalEmployerCost - plannedGrossTotal;
    const plannedEmployerTaxes = employerCostAmount * 0.4; // Rough breakdown
    const plannedSocialContributions = employerCostAmount * 0.35;
    const plannedHealthInsurance = employerCostAmount * 0.15;
    const plannedBenefits = employerCostAmount * 0.1;

    // Period label
    const periodDate = new Date(period);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const periodLabel = `${monthNames[periodDate.getMonth()]} ${periodDate.getFullYear()}`;

    // Upsert the planned compensation
    const planned = await prisma.monthlyPlannedCompensation.upsert({
      where: {
        datasetId_period_employeeId: {
          datasetId: id,
          period: new Date(period),
          employeeId,
        },
      },
      update: {
        plannedGrossSalary,
        plannedGrossBonus,
        plannedGrossEquity,
        plannedGrossTotal,
        plannedEmployerTaxes,
        plannedSocialContributions,
        plannedHealthInsurance,
        plannedBenefits,
        plannedOtherEmployerCosts: null,
        plannedTotalEmployerCost,
        isManualOverride: true,
      },
      create: {
        datasetId: id,
        period: new Date(period),
        periodLabel,
        employeeId,
        plannedGrossSalary,
        plannedGrossBonus,
        plannedGrossEquity,
        plannedGrossTotal,
        plannedEmployerTaxes,
        plannedSocialContributions,
        plannedHealthInsurance,
        plannedBenefits,
        plannedOtherEmployerCosts: null,
        plannedTotalEmployerCost,
        isManualOverride: true,
        currency: dataset.currency,
      },
    });

    return NextResponse.json({ success: true, planned });
  } catch (error) {
    console.error('Update planned compensation error:', error);
    return NextResponse.json(
      { error: 'Failed to update planned compensation' },
      { status: 500 }
    );
  }
}
