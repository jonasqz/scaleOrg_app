import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

export async function POST(
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

    const body = await request.json();

    // Validate required fields
    if (!body.period) {
      return NextResponse.json({ error: 'Period is required' }, { status: 400 });
    }
    if (!body.grossSalary || body.grossSalary <= 0) {
      return NextResponse.json({ error: 'Gross salary is required and must be greater than 0' }, { status: 400 });
    }

    // Create the employer cost record
    const employerCost = await prisma.monthlyEmployerCost.create({
      data: {
        datasetId: params.id,
        period: new Date(body.period),
        periodLabel: body.periodLabel,
        employeeId: body.employeeId || null,
        department: body.department || null,
        grossSalary: body.grossSalary,
        grossBonus: body.grossBonus || null,
        grossEquity: body.grossEquity || null,
        grossTotal: body.grossTotal,
        employerTaxes: body.employerTaxes || null,
        socialContributions: body.socialContributions || null,
        healthInsurance: body.healthInsurance || null,
        benefits: body.benefits || null,
        otherEmployerCosts: body.otherEmployerCosts || null,
        totalEmployerCost: body.totalEmployerCost,
        employerCostRatio: body.employerCostRatio,
        currency: body.currency,
        source: body.source || 'MANUAL',
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, employerCost });
  } catch (error) {
    console.error('Employer cost creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create employer cost record' },
      { status: 500 }
    );
  }
}
