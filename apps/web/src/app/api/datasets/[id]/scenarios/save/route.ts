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
    const {
      name,
      description,
      type,
      parameters,
      operations,
      affectedEmployees,
      monthlyBurnRate,
      runway,
      yearEndProjection,
      currentCash,
      baseline,
      scenario,
      delta,
    } = body;

    // Create or update scenario
    const savedScenario = await prisma.scenario.create({
      data: {
        datasetId: params.id,
        name,
        description: description || null,
        type: type.toUpperCase(), // Convert to match enum (e.g., 'hiring_freeze' -> 'HIRING_FREEZE')
        parameters: parameters || {},
        operations: operations || {},
        affectedEmployees: affectedEmployees || null,
        monthlyBurnRate: monthlyBurnRate || null,
        runway: runway || null,
        yearEndProjection: yearEndProjection || null,
        currentCash: currentCash ? Number(currentCash) : null,
        status: 'CALCULATED',
        calculatedAt: new Date(),
      },
    });

    // Create scenario result
    if (baseline && scenario && delta) {
      await prisma.scenarioResult.create({
        data: {
          scenarioId: savedScenario.id,
          metrics: {
            baseline,
            scenario,
          },
          delta,
        },
      });
    }

    return NextResponse.json({
      success: true,
      scenarioId: savedScenario.id,
      scenario: savedScenario,
    });
  } catch (error) {
    console.error('Save scenario error:', error);
    return NextResponse.json(
      { error: 'Failed to save scenario' },
      { status: 500 }
    );
  }
}
