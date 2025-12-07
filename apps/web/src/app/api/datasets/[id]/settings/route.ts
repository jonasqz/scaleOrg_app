import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';

/**
 * GET /api/datasets/[id]/settings
 *
 * Get dataset settings with actual departments from employees
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

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const datasetId = params.id;

    // Verify dataset ownership
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
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Get unique departments from employees
    const departments = Array.from(
      new Set(
        dataset.employees
          .map((e) => e.department)
          .filter((d) => d && d.trim() !== '')
      )
    ).sort();

    // Get or create settings
    let settings = await prisma.datasetSettings.findUnique({
      where: { datasetId },
    });

    if (!settings) {
      // Create with smart defaults based on existing departments
      const defaultCategories: Record<string, string> = {};

      departments.forEach((dept) => {
        const lower = dept.toLowerCase();
        if (/(eng|product|design|data|qa|r&d|tech|develop)/i.test(lower)) {
          defaultCategories[dept] = 'R&D';
        } else if (/(sales|market|customer|cs|gtm|sdr|partner|revenue|account|commercial)/i.test(lower)) {
          defaultCategories[dept] = 'GTM';
        } else if (/(finance|hr|legal|it|admin|recruit|people|talent|executive|c-level)/i.test(lower)) {
          defaultCategories[dept] = 'G&A';
        } else if (/(ops|logistic|supply|manufactur|facility|production)/i.test(lower)) {
          defaultCategories[dept] = 'Operations';
        } else {
          defaultCategories[dept] = 'Other';
        }
      });

      settings = await prisma.datasetSettings.create({
        data: {
          datasetId,
          departmentCategories: defaultCategories,
        },
      });
    }

    return NextResponse.json({
      departments,
      departmentCategories: settings.departmentCategories || {},
    });
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
 *   departmentCategories: { "Engineering": "R&D", "Sales": "GTM", ... }
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

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const datasetId = params.id;

    // Verify dataset ownership
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: datasetId,
        userId: user.id,
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const body = await req.json();
    const { departmentCategories } = body;

    if (!departmentCategories || typeof departmentCategories !== 'object') {
      return NextResponse.json(
        { error: 'Invalid department categories' },
        { status: 400 }
      );
    }

    // Validate categories
    const validCategories = ['R&D', 'GTM', 'G&A', 'Operations', 'Other'];
    for (const [dept, category] of Object.entries(departmentCategories)) {
      if (typeof category !== 'string' || !validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category for ${dept}: ${category}` },
          { status: 400 }
        );
      }
    }

    // Upsert settings
    const settings = await prisma.datasetSettings.upsert({
      where: { datasetId },
      create: {
        datasetId,
        departmentCategories,
      },
      update: {
        departmentCategories,
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
