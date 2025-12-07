import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';
import { Prisma } from '@scleorg/database';

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
    const { period, revenue } = body;

    if (!period || revenue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Period label
    const periodDate = new Date(period);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const periodLabel = `${monthNames[periodDate.getMonth()]} ${periodDate.getFullYear()}`;

    // Upsert the revenue
    const revenueRecord = await prisma.monthlyRevenue.upsert({
      where: {
        datasetId_period: {
          datasetId: id,
          period: new Date(period),
        },
      },
      update: {
        revenue: new Prisma.Decimal(revenue),
      },
      create: {
        datasetId: id,
        period: new Date(period),
        periodLabel,
        revenue: new Prisma.Decimal(revenue),
        source: 'MANUAL',
        currency: dataset.currency,
      },
    });

    return NextResponse.json({ success: true, revenue: revenueRecord });
  } catch (error) {
    console.error('Update revenue error:', error);
    return NextResponse.json(
      { error: 'Failed to update revenue' },
      { status: 500 }
    );
  }
}
