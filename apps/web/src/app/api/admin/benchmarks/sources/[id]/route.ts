// Admin API for individual benchmark source operations
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';
import type { BenchmarkSourceInput } from '@scleorg/types';

// GET - Fetch single benchmark source
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const source = await prisma.benchmarkSource.findUnique({
    where: { id: params.id },
    include: {
      organizationalBenchmarks: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          organizationalBenchmarks: true,
          auditLogs: true,
        },
      },
    },
  });

  if (!source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  return NextResponse.json(source);
}

// PATCH - Update benchmark source
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add admin role check

  const source = await prisma.benchmarkSource.findUnique({
    where: { id: params.id },
  });

  if (!source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  const body: Partial<BenchmarkSourceInput> = await request.json();

  const updated = await prisma.benchmarkSource.update({
    where: { id: params.id },
    data: {
      name: body.name,
      type: body.type,
      website: body.website,
      contactEmail: body.contactEmail,
      description: body.description,
      licenseType: body.licenseType,
      accessNotes: body.accessNotes,
      lastContacted: body.lastContacted ? new Date(body.lastContacted) : undefined,
      reliability: body.reliability,
      updateFrequency: body.updateFrequency,
      isActive: body.isActive !== undefined ? body.isActive : undefined,
    },
  });

  return NextResponse.json(updated);
}

// DELETE - Delete benchmark source (only if no benchmarks reference it)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add admin role check

  const source = await prisma.benchmarkSource.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          organizationalBenchmarks: true,
        },
      },
    },
  });

  if (!source) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  if (source._count.organizationalBenchmarks > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete source. ${source._count.organizationalBenchmarks} benchmarks reference this source. Please reassign or delete those benchmarks first.`,
      },
      { status: 409 }
    );
  }

  await prisma.benchmarkSource.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true, message: 'Source deleted' });
}
