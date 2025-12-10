import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

// PATCH /api/admin/benchmarks/compensation/:id - Update compensation benchmark
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here

    const body = await request.json();

    // Check if benchmark exists
    const existing = await prisma.compensationBenchmark.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Benchmark not found' }, { status: 404 });
    }

    const benchmark = await prisma.compensationBenchmark.update({
      where: { id: params.id },
      data: {
        roleFamily: body.roleFamily,
        standardizedTitle: body.standardizedTitle,
        seniorityLevel: body.seniorityLevel,
        industry: body.industry,
        region: body.region,
        companySize: body.companySize,
        p10TotalComp: body.p10TotalComp || null,
        p25TotalComp: body.p25TotalComp || null,
        p50TotalComp: body.p50TotalComp || null,
        p75TotalComp: body.p75TotalComp || null,
        p90TotalComp: body.p90TotalComp || null,
        p10BaseSalary: body.p10BaseSalary || null,
        p25BaseSalary: body.p25BaseSalary || null,
        p50BaseSalary: body.p50BaseSalary || null,
        p75BaseSalary: body.p75BaseSalary || null,
        p90BaseSalary: body.p90BaseSalary || null,
        sampleSize: parseInt(body.sampleSize),
        currency: body.currency,
        dataSource: body.dataSource || 'manual',
      },
    });

    return NextResponse.json(benchmark);
  } catch (error) {
    console.error('Error updating compensation benchmark:', error);
    return NextResponse.json(
      { error: 'Failed to update compensation benchmark' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/benchmarks/compensation/:id - Delete compensation benchmark
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here

    // Check if benchmark exists
    const existing = await prisma.compensationBenchmark.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Benchmark not found' }, { status: 404 });
    }

    await prisma.compensationBenchmark.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting compensation benchmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete compensation benchmark' },
      { status: 500 }
    );
  }
}
