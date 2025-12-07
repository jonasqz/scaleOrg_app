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

    // Verify dataset ownership
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Get compensation planning data
    const compResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/datasets/${id}/compensation/planning`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!compResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch compensation data' }, { status: 500 });
    }

    const compData = await compResponse.json();

    // Build CSV
    const rows: string[] = [];

    // Header row
    const months = compData.months.map((m: any) => m.fullLabel);
    rows.push(['Department', 'Employee', ...months.map((m: string) => `${m} (Planned)`), ...months.map((m: string) => `${m} (Actual)`)].join(','));

    // Data rows
    compData.departments.forEach((dept: any) => {
      dept.employees.forEach((emp: any) => {
        const plannedValues = emp.monthlyData.map((m: any) => m.planned.totalEmployerCost.toFixed(2));
        const actualValues = emp.monthlyData.map((m: any) => m.actual.totalEmployerCost !== null ? m.actual.totalEmployerCost.toFixed(2) : '');

        rows.push([
          `"${dept.department}"`,
          `"${emp.employeeName}"`,
          ...plannedValues,
          ...actualValues,
        ].join(','));
      });
    });

    // Create CSV content
    const csv = rows.join('\n');

    // Return as downloadable file
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${dataset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_compensation_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export compensation data' },
      { status: 500 }
    );
  }
}
