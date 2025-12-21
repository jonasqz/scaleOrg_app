// API endpoint to update dataset settings (benchmarking, categorization, and cash balance)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';
import { Prisma } from '@scleorg/database';

// GET endpoint for fetching dataset settings and departments
export async function GET(
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
    include: {
      employees: {
        select: {
          department: true,
        },
      },
      settings: true,
    },
  });

  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  // Get unique departments from employees
  const departments = Array.from(
    new Set(dataset.employees.map(emp => emp.department))
  ).sort();

  // Get department categories from settings
  const departmentCategories = dataset.settings?.departmentCategories || {};

  return NextResponse.json({
    departments,
    departmentCategories,
    industry: dataset.settings?.industry,
    region: dataset.settings?.region,
    growthStage: dataset.settings?.growthStage,
    currentCashBalance: dataset.currentCashBalance,
    settings: {
      selectedKPIs: dataset.settings?.selectedKPIs || [],
    },
  });
}

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
      // selectedKPIs for KPI dashboard preferences
      ...(body.selectedKPIs !== undefined && { selectedKPIs: body.selectedKPIs }),
    },
    create: {
      datasetId,
      industry: body.industry || null,
      region: body.region || null,
      growthStage: body.growthStage || null,
      ...(body.departmentCategories && { departmentCategories: body.departmentCategories }),
      ...(body.selectedKPIs !== undefined && { selectedKPIs: body.selectedKPIs }),
    },
  });

  return NextResponse.json(settings);
}

// PUT endpoint for updating dataset-level settings (like cash balance and department categories)
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

  // Update dataset fields (like cash balance)
  if (body.currentCashBalance !== undefined) {
    await prisma.dataset.update({
      where: {
        id: datasetId,
      },
      data: {
        currentCashBalance: new Prisma.Decimal(body.currentCashBalance),
      },
    });
  }

  // Update dataset settings (like department categories)
  if (body.departmentCategories !== undefined) {
    await prisma.datasetSettings.upsert({
      where: {
        datasetId,
      },
      update: {
        departmentCategories: body.departmentCategories,
      },
      create: {
        datasetId,
        departmentCategories: body.departmentCategories,
      },
    });
  }

  // Return updated data
  const updatedDataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    include: { settings: true },
  });

  return NextResponse.json(updatedDataset);
}
