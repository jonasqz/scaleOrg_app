import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

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
        totalCompensation: body.totalCompensation,
        fteFactor: body.employmentType === 'PART_TIME' ? 0.5 : 1.0,
        startDate: body.startDate ? new Date(body.startDate) : null,
      },
    });

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

    // Delete employee
    await prisma.employee.delete({
      where: {
        id: params.employeeId,
        datasetId: params.id, // Ensure employee belongs to this dataset
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
