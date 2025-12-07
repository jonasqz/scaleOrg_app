import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';
import { syncPlannedCompensation, validateEmployeeData } from '@/lib/sync-planned-compensation';

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
      fteFactor,
      bonus,
      equityValue,
      annualSalary,
      totalCompensation,
      startDate,
      location,
      managerId,
      costCenter,
    } = body;

    // Validate employee data
    const validation = validateEmployeeData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        datasetId: params.id,
        employeeName,
        email,
        department,
        role,
        level: level || null,
        employmentType: employmentType || 'FTE',
        fteFactor: fteFactor !== undefined ? fteFactor : 1.0,
        bonus: bonus || null,
        equityValue: equityValue || null,
        annualSalary: annualSalary || totalCompensation,
        totalCompensation,
        startDate: startDate ? new Date(startDate) : null,
        location: location || null,
        managerId: managerId || null,
        costCenter: costCenter || null,
      },
    });

    // Sync planned compensation for future months
    await syncPlannedCompensation(params.id);

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
