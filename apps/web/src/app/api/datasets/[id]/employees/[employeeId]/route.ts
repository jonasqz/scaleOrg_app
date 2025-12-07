import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';
import { syncPlannedCompensation, validateEmployeeData } from '@/lib/sync-planned-compensation';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; employeeId: string } }
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

    // Get request body
    const body = await request.json();

    // Validate employee data
    const validation = validateEmployeeData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Update employee
    const employee = await prisma.employee.update({
      where: {
        id: params.employeeId,
        datasetId: params.id, // Ensure employee belongs to this dataset
      },
      data: {
        employeeName: body.employeeName,
        email: body.email || null,
        department: body.department,
        role: body.role || null,
        level: body.level || null,
        employmentType: body.employmentType,
        fteFactor: body.fteFactor !== undefined ? body.fteFactor : (body.employmentType === 'PART_TIME' ? 0.5 : 1.0),
        bonus: body.bonus || null,
        equityValue: body.equityValue || null,
        annualSalary: body.annualSalary || null,
        totalCompensation: body.totalCompensation,
        startDate: body.startDate ? new Date(body.startDate) : null,
        location: body.location || null,
        managerId: body.managerId || null,
        costCenter: body.costCenter || null,
      },
    });

    // Sync planned compensation for future months
    await syncPlannedCompensation(params.id);

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; employeeId: string } }
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

    // Soft delete employee by setting endDate to now
    // This preserves data integrity and allows historical reporting
    const employee = await prisma.employee.update({
      where: {
        id: params.employeeId,
        datasetId: params.id, // Ensure employee belongs to this dataset
      },
      data: {
        endDate: new Date(),
      },
    });

    // Sync planned compensation for future months
    // This will exclude the deleted employee from future calculations
    await syncPlannedCompensation(params.id);

    return NextResponse.json({ success: true, employee });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
