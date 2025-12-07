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
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Generate 24 months (12 past + current + 11 future)
    const months = generateMonths(-12, 24);

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

    // Fetch compensation data (burn rate)
    const compensationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/datasets/${id}/compensation/planning`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    let compensationData: any = null;
    if (compensationResponse.ok) {
      compensationData = await compensationResponse.json();
    }

    // Build monthly data
    const monthlyData = months.map((month, idx) => {
      // Find revenue for this month
      const revenue = revenues.find(r =>
        r.period.toISOString().split('T')[0] === month.period
      );

      // Find burn for this month from compensation data
      const monthCompData = compensationData?.monthlySummary?.find((m: any) => m.month === month.period);
      const burn = monthCompData?.actual || monthCompData?.planned || null;

      // Calculate net cash flow
      const revenueValue = revenue ? Number(revenue.revenue) : null;
      const netCashFlow = revenueValue !== null && burn !== null
        ? revenueValue - burn
        : null;

      return {
        month: month.period,
        label: month.label,
        isPast: month.isPast,
        isCurrent: month.isCurrent,
        isFuture: month.isFuture,
        revenue: revenueValue,
        burn: burn,
        netCashFlow: netCashFlow,
        isRevenueEditable: month.isCurrent || month.isFuture,
      };
    });

    // Calculate ending cash for each month
    let runningCash = dataset.currentCashBalance ? Number(dataset.currentCashBalance) : 0;
    const currentMonthIndex = monthlyData.findIndex(m => m.isCurrent);

    // For past months, work backwards from current cash
    // For current/future months, work forwards
    monthlyData.forEach((month, idx) => {
      if (idx < currentMonthIndex) {
        // Past month - we don't recalculate, just show current as-is
        month.endingCash = null; // Could calculate backwards if needed
      } else if (idx === currentMonthIndex) {
        // Current month
        month.endingCash = runningCash;
      } else {
        // Future months
        const prevMonth = monthlyData[idx - 1];
        const startingCash = prevMonth.endingCash || runningCash;
        const netFlow = month.netCashFlow || 0;
        month.endingCash = startingCash + netFlow;
      }
    });

    // Calculate summary metrics
    const pastRevenues = monthlyData
      .filter(m => m.isPast && m.revenue !== null)
      .map(m => m.revenue!);

    const avgMonthlyRevenue = pastRevenues.length > 0
      ? pastRevenues.reduce((sum, r) => sum + r, 0) / pastRevenues.length
      : 0;

    const avgMonthlyBurn = compensationData?.summary?.avgMonthlyBurn || 0;

    // Calculate runway based on current projections
    let runway = null;
    let runwayDate = null;

    if (avgMonthlyBurn > 0) {
      const netBurn = avgMonthlyBurn - avgMonthlyRevenue;
      if (netBurn > 0 && runningCash > 0) {
        runway = runningCash / netBurn;
        const runwayMonths = Math.floor(runway);
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + runwayMonths);
        runwayDate = futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    }

    return NextResponse.json({
      monthlyData,
      summary: {
        currentCash: runningCash,
        avgMonthlyRevenue,
        avgMonthlyBurn,
        runway,
        runwayDate,
      },
    });
  } catch (error) {
    console.error('Cash flow error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash flow data' },
      { status: 500 }
    );
  }
}
