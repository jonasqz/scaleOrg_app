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
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      );
    }

    // Bulk upsert revenues
    const results = [];
    for (const update of updates) {
      const { period, revenue } = update;

      if (!period || revenue === undefined) {
        continue;
      }

      // Period label
      const periodDate = new Date(period);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const periodLabel = `${monthNames[periodDate.getMonth()]} ${periodDate.getFullYear()}`;

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
          source: 'CALCULATED',
          currency: dataset.currency,
        },
      });

      results.push(revenueRecord);
    }

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('Bulk update revenue error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update revenue' },
      { status: 500 }
    );
  }
}
