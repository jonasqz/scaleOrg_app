import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

// GET /api/datasets - List all datasets for current user
export async function GET() {
  try {
    const { userId } = await auth();

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

    const datasets = await prisma.dataset.findMany({
      where: { userId: user.id },
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
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

// POST /api/datasets - Create new dataset
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

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
    const { name, description, companyName, totalRevenue, currency } = body;

    const dataset = await prisma.dataset.create({
      data: {
        userId: user.id,
        name,
        description,
        companyName,
        totalRevenue,
        currency: currency || 'EUR',
        fileName: 'Manual Entry',
        fileUrl: '',
        fileType: 'manual',
        status: 'READY',
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ dataset }, { status: 201 });
  } catch (error) {
    console.error('Error creating dataset:', error);
    return NextResponse.json(
      { error: 'Failed to create dataset' },
      { status: 500 }
    );
  }
}
