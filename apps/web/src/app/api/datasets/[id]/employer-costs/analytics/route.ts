import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Verify dataset ownership
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Calculate date 12 months ago
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Fetch all employer cost records for the last 12 months
    const costs = await prisma.monthlyEmployerCost.findMany({
      where: {
        datasetId: params.id,
        period: {
          gte: twelveMonthsAgo,
        },
      },
      orderBy: {
        period: 'asc',
      },
    });

    if (costs.length === 0) {
      return NextResponse.json({
        monthlyTrend: [],
        departmentCosts: [],
        summary: null,
      });
    }

    // Group by period for monthly trend
    const periodMap = new Map<string, {
      period: Date;
      periodLabel: string;
      totalCost: number;
      employeeCount: number;
      grossSalary: number;
      employerTaxes: number;
      socialContributions: number;
      healthInsurance: number;
      benefits: number;
      otherCosts: number;
      costRatioSum: number;
      costRatioCount: number;
    }>();

    costs.forEach((cost) => {
      const periodKey = cost.period.toISOString();
      const existing = periodMap.get(periodKey);

      if (existing) {
        existing.totalCost += Number(cost.totalEmployerCost);
        existing.employeeCount += cost.employeeId ? 1 : 0;
        existing.grossSalary += Number(cost.grossSalary);
        existing.employerTaxes += Number(cost.employerTaxes || 0);
        existing.socialContributions += Number(cost.socialContributions || 0);
        existing.healthInsurance += Number(cost.healthInsurance || 0);
        existing.benefits += Number(cost.benefits || 0);
        existing.otherCosts += Number(cost.otherEmployerCosts || 0);
        if (cost.employerCostRatio) {
          existing.costRatioSum += Number(cost.employerCostRatio);
          existing.costRatioCount += 1;
        }
      } else {
        periodMap.set(periodKey, {
          period: cost.period,
          periodLabel: cost.periodLabel,
          totalCost: Number(cost.totalEmployerCost),
          employeeCount: cost.employeeId ? 1 : 0,
          grossSalary: Number(cost.grossSalary),
          employerTaxes: Number(cost.employerTaxes || 0),
          socialContributions: Number(cost.socialContributions || 0),
          healthInsurance: Number(cost.healthInsurance || 0),
          benefits: Number(cost.benefits || 0),
          otherCosts: Number(cost.otherEmployerCosts || 0),
          costRatioSum: cost.employerCostRatio ? Number(cost.employerCostRatio) : 0,
          costRatioCount: cost.employerCostRatio ? 1 : 0,
        });
      }
    });

    // Convert to array and calculate averages
    const monthlyTrend = Array.from(periodMap.values())
      .sort((a, b) => a.period.getTime() - b.period.getTime())
      .map((period) => ({
        period: period.period.toISOString().split('T')[0],
        periodLabel: period.periodLabel,
        totalCost: period.totalCost,
        employeeCount: period.employeeCount,
        avgCostPerEmployee: period.employeeCount > 0 ? period.totalCost / period.employeeCount : 0,
        avgCostRatio: period.costRatioCount > 0 ? period.costRatioSum / period.costRatioCount : 0,
        grossSalary: period.grossSalary,
        employerTaxes: period.employerTaxes,
        socialContributions: period.socialContributions,
        healthInsurance: period.healthInsurance,
        benefits: period.benefits,
        otherCosts: period.otherCosts,
      }));

    // Calculate summary metrics
    const currentMonth = monthlyTrend[monthlyTrend.length - 1];
    const previousMonth = monthlyTrend.length > 1 ? monthlyTrend[monthlyTrend.length - 2] : null;

    const costGrowthRate = previousMonth
      ? ((currentMonth.totalCost - previousMonth.totalCost) / previousMonth.totalCost) * 100
      : 0;

    // Calculate average monthly growth rate over available period
    let avgMonthlyGrowthRate = 0;
    if (monthlyTrend.length >= 2) {
      const firstMonth = monthlyTrend[0];
      const lastMonth = monthlyTrend[monthlyTrend.length - 1];
      const totalGrowth = (lastMonth.totalCost - firstMonth.totalCost) / firstMonth.totalCost;
      const monthsElapsed = monthlyTrend.length - 1;
      avgMonthlyGrowthRate = monthsElapsed > 0 ? (totalGrowth / monthsElapsed) * 100 : 0;
    }

    // Project annual cost based on current month
    const projectedAnnualCost = currentMonth.totalCost * 12;

    const summary = {
      currentMonthCost: currentMonth.totalCost,
      currentMonthCostPerEmployee: currentMonth.avgCostPerEmployee,
      currentMonthRatio: currentMonth.avgCostRatio,
      previousMonthCost: previousMonth?.totalCost || 0,
      costGrowthRate,
      avgMonthlyGrowthRate,
      projectedAnnualCost,
      monthsAvailable: monthlyTrend.length,
    };

    // Group by department for current month
    const departmentMap = new Map<string, {
      department: string;
      totalCost: number;
      employeeCount: number;
    }>();

    // Get most recent period
    const latestPeriod = costs.reduce((max, cost) =>
      cost.period > max ? cost.period : max,
      costs[0].period
    );

    costs
      .filter((cost) => cost.period.getTime() === latestPeriod.getTime() && cost.department)
      .forEach((cost) => {
        const dept = cost.department!;
        const existing = departmentMap.get(dept);

        if (existing) {
          existing.totalCost += Number(cost.totalEmployerCost);
          existing.employeeCount += cost.employeeId ? 1 : 0;
        } else {
          departmentMap.set(dept, {
            department: dept,
            totalCost: Number(cost.totalEmployerCost),
            employeeCount: cost.employeeId ? 1 : 0,
          });
        }
      });

    const departmentCosts = Array.from(departmentMap.values())
      .map((dept) => ({
        department: dept.department,
        totalCost: dept.totalCost,
        employeeCount: dept.employeeCount,
        avgCostPerEmployee: dept.employeeCount > 0 ? dept.totalCost / dept.employeeCount : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    return NextResponse.json({
      monthlyTrend,
      departmentCosts,
      summary,
    });
  } catch (error) {
    console.error('Employer cost analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employer cost analytics' },
      { status: 500 }
    );
  }
}
