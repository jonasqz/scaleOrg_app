import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

// GET - Load a specific scenario
export async function GET(
  request: Request,
  { params }: { params: { id: string; scenarioId: string } }
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

    // Fetch scenario with results
    const scenario = await prisma.scenario.findFirst({
      where: {
        id: params.scenarioId,
        datasetId: params.id,
      },
      include: {
        results: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error('Get scenario error:', error);
    return NextResponse.json(
      { error: 'Failed to get scenario' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a scenario
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; scenarioId: string } }
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

    // Delete scenario (cascade will delete results)
    await prisma.scenario.delete({
      where: {
        id: params.scenarioId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete scenario error:', error);
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}

// PATCH - Update a scenario
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; scenarioId: string } }
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

    // Update scenario
    const updatedScenario = await prisma.scenario.update({
      where: {
        id: params.scenarioId,
      },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        type: type !== undefined ? type : undefined,
        parameters: parameters !== undefined ? parameters : undefined,
        operations: operations !== undefined ? operations : undefined,
        affectedEmployees: affectedEmployees !== undefined ? affectedEmployees : undefined,
        monthlyBurnRate: monthlyBurnRate !== undefined ? monthlyBurnRate : undefined,
        runway: runway !== undefined ? runway : undefined,
        yearEndProjection: yearEndProjection !== undefined ? yearEndProjection : undefined,
        currentCash: currentCash !== undefined ? (currentCash ? Number(currentCash) : null) : undefined,
        status: 'completed',
        calculatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // If new results are provided, create a new result entry
    if (baseline && scenario && delta) {
      await prisma.scenarioResult.create({
        data: {
          scenarioId: updatedScenario.id,
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
      scenario: updatedScenario,
    });
  } catch (error) {
    console.error('Update scenario error:', error);
    return NextResponse.json(
      { error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}
