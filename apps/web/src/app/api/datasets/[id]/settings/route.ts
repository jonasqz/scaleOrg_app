import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';

/**
 * GET /api/datasets/[id]/settings
 *
 * Get dataset settings (R&D/GTM department mappings, etc.)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const datasetId = params.id;

    // Verify user owns this dataset
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: { userId: true },
    });

    if (!dataset || dataset.userId !== userId) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Get or create settings
    let settings = await prisma.datasetSettings.findUnique({
      where: { datasetId },
    });

    // If settings don't exist, create with defaults
    if (!settings) {
      settings = await prisma.datasetSettings.create({
        data: {
          datasetId,
          rdDepartments: ['Engineering', 'Product', 'Design'],
          gtmDepartments: ['Sales', 'Marketing', 'Customer Success'],
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching dataset settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/datasets/[id]/settings
 *
 * Update dataset settings
 *
 * Request body:
 * {
 *   rdDepartments?: string[];
 *   gtmDepartments?: string[];
 * }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const datasetId = params.id;

    // Verify user owns this dataset
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: { userId: true },
    });

    if (!dataset || dataset.userId !== userId) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const body = await req.json();
    const { rdDepartments, gtmDepartments } = body;

    // Validate arrays if provided
    if (rdDepartments !== undefined && !Array.isArray(rdDepartments)) {
      return NextResponse.json(
        { error: 'rdDepartments must be an array' },
        { status: 400 }
      );
    }

    if (gtmDepartments !== undefined && !Array.isArray(gtmDepartments)) {
      return NextResponse.json(
        { error: 'gtmDepartments must be an array' },
        { status: 400 }
      );
    }

    // Update or create settings
    const settings = await prisma.datasetSettings.upsert({
      where: { datasetId },
      create: {
        datasetId,
        rdDepartments: rdDepartments || ['Engineering', 'Product', 'Design'],
        gtmDepartments: gtmDepartments || ['Sales', 'Marketing', 'Customer Success'],
      },
      update: {
        ...(rdDepartments !== undefined && { rdDepartments }),
        ...(gtmDepartments !== undefined && { gtmDepartments }),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating dataset settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
