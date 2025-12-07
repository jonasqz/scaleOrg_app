import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Verify dataset ownership and get employees
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        employees: {
          orderBy: [{ department: 'asc' }, { employeeName: 'asc' }],
        },
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Build CSV
    const rows: string[] = [];

    // Header row
    rows.push([
      'Employee Name',
      'Email',
      'Department',
      'Role',
      'Level',
      'Employment Type',
      'FTE Factor',
      'Annual Salary',
      'Bonus',
      'Equity Value',
      'Total Compensation',
      'Start Date',
      'End Date',
      'Location',
      'Manager ID',
      'Cost Center',
    ].join(','));

    // Data rows
    dataset.employees.forEach((emp) => {
      rows.push([
        `"${emp.employeeName || ''}"`,
        `"${emp.email || ''}"`,
        `"${emp.department}"`,
        `"${emp.role || ''}"`,
        emp.level || '',
        emp.employmentType,
        emp.fteFactor.toString(),
        emp.annualSalary ? Number(emp.annualSalary).toFixed(2) : '',
        emp.bonus ? Number(emp.bonus).toFixed(2) : '',
        emp.equityValue ? Number(emp.equityValue).toFixed(2) : '',
        Number(emp.totalCompensation).toFixed(2),
        emp.startDate ? emp.startDate.toISOString().split('T')[0] : '',
        emp.endDate ? emp.endDate.toISOString().split('T')[0] : '',
        `"${emp.location || ''}"`,
        emp.managerId || '',
        emp.costCenter || '',
      ].join(','));
    });

    // Create CSV content
    const csv = rows.join('\n');

    // Return as downloadable file
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${dataset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_employees_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export employees' },
      { status: 500 }
    );
  }
}
