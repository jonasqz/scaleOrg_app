// API endpoint to update dataset settings (benchmarking, categorization, and cash balance)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';
import { Prisma } from '@scleorg/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: datasetId } = await params;

  // Verify ownership
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const dataset = await prisma.dataset.findFirst({
    where: {
      id: datasetId,
      userId: user.id,
    },
  });

  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  // Parse request body
  const body = await request.json();

  // Update or create settings
  const settings = await prisma.datasetSettings.upsert({
    where: {
      datasetId,
    },
    update: {
      industry: body.industry || null,
      region: body.region || null,
      growthStage: body.growthStage || null,
      // departmentCategories can also be updated here if needed
      ...(body.departmentCategories && { departmentCategories: body.departmentCategories }),
    },
    create: {
      datasetId,
      industry: body.industry || null,
      region: body.region || null,
      growthStage: body.growthStage || null,
      ...(body.departmentCategories && { departmentCategories: body.departmentCategories }),
    },
  });

  return NextResponse.json(settings);
}

// PUT endpoint for updating dataset-level settings (like cash balance)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: datasetId } = await params;

  // Verify ownership
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const dataset = await prisma.dataset.findFirst({
    where: {
      id: datasetId,
      userId: user.id,
    },
  });

  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  // Parse request body
  const body = await request.json();

  // Update dataset fields
  const updatedDataset = await prisma.dataset.update({
    where: {
      id: datasetId,
    },
    data: {
      ...(body.currentCashBalance !== undefined && {
        currentCashBalance: new Prisma.Decimal(body.currentCashBalance),
      }),
    },
  });

  return NextResponse.json(updatedDataset);
}
