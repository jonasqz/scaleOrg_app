import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

// GET /api/datasets - List all datasets for current organization/user
export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user in database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      const clerkUser = await (await import('@clerk/nextjs/server')).currentUser();
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || '',
        },
      });
    }

    // Filter by organization context or personal workspace
    const datasets = await prisma.dataset.findMany({
      where: orgId
        ? { organizationId: orgId }
        : { userId: user.id, organizationId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            employees: true,
            openRoles: true,
          },
        },
      },
    });

    return NextResponse.json({ datasets });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST /api/datasets - Create new company
export async function POST(request: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      const clerkUser = await (await import('@clerk/nextjs/server')).currentUser();
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || '',
        },
      });
    }

    const body = await request.json();
    const {
      name,
      description,
      companyName,
      totalRevenue,
      currentCashBalance,
      currency,
      fileName,
      fileUrl,
      fileType,
      status,
      benchmarking, // { industry, region, growthStage }
    } = body;

    const dataset = await prisma.dataset.create({
      data: {
        userId: user.id,
        organizationId: orgId, // Set organization context from Clerk
        name,
        description,
        companyName,
        totalRevenue,
        currentCashBalance,
        currency: currency || 'EUR',
        fileName: fileName || 'Manual Entry',
        fileUrl: fileUrl || '',
        fileType: fileType || 'manual',
        status: status || 'READY',
        processedAt: new Date(),
        // Create DatasetSettings if benchmarking data provided
        ...(benchmarking && {
          settings: {
            create: {
              industry: benchmarking.industry,
              region: benchmarking.region,
              growthStage: benchmarking.growthStage,
            },
          },
        }),
      },
    });

    return NextResponse.json({ dataset }, { status: 201 });
  } catch (error) {
    console.error('Error creating dataset:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
