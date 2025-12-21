import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
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

    // Verify employee belongs to dataset
    const employee = await prisma.employee.findFirst({
      where: {
        id: params.employeeId,
        datasetId: params.id,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      period,
      plannedGrossSalary,
      plannedGrossBonus,
      plannedGrossEquity,
      plannedGrossTotal,
    } = body;

    // Parse period (format: "2025-01")
    const [year, month] = period.split('-').map(Number);
    const periodDate = new Date(year, month - 1, 1);
    const periodLabel = periodDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    // Calculate employer costs (using a simple multiplier for now)
    // In production, this should use actual employer cost data
    const employerCostRatio = 1.35; // 35% overhead
    const plannedTotalEmployerCost = plannedGrossTotal * employerCostRatio;

    // Upsert monthly planned compensation
    const monthlyComp = await prisma.monthlyPlannedCompensation.upsert({
      where: {
        datasetId_period_employeeId: {
          datasetId: params.id,
          period: periodDate,
          employeeId: params.employeeId,
        },
      },
      update: {
        plannedGrossSalary,
        plannedGrossBonus,
        plannedGrossEquity,
        plannedGrossTotal,
        plannedTotalEmployerCost,
        isManualOverride: true,
      },
      create: {
        datasetId: params.id,
        employeeId: params.employeeId,
        period: periodDate,
        periodLabel,
        plannedGrossSalary,
        plannedGrossBonus,
        plannedGrossEquity,
        plannedGrossTotal,
        plannedTotalEmployerCost,
        isManualOverride: true,
        currency: dataset.currency,
      },
    });

    return NextResponse.json({
      success: true,
      data: monthlyComp,
    });
  } catch (error) {
    console.error('Error saving monthly compensation:', error);
    return NextResponse.json(
      { error: 'Failed to save compensation data' },
      { status: 500 }
    );
  }
}
