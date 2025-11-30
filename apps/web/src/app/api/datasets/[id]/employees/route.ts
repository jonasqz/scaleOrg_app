import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

// POST /api/datasets/:id/employees - Add employee
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
      employeeName,
      email,
      department,
      role,
      level,
      employmentType,
      annualSalary,
      totalCompensation,
      startDate,
    } = body;

    const employee = await prisma.employee.create({
      data: {
        datasetId: params.id,
        employeeName,
        email,
        department,
        role,
        level: level || null,
        employmentType: employmentType || 'FTE',
        fteFactor: 1.0,
        annualSalary: annualSalary || totalCompensation,
        totalCompensation,
        startDate: startDate ? new Date(startDate) : null,
      },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
