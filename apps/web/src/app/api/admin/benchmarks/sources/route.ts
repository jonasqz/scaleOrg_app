// Admin API for managing benchmark sources
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';
import type { BenchmarkSourceInput } from '@scleorg/types';

// GET - List all benchmark sources
export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const isActive = searchParams.get('isActive');

  const where: any = {};
  if (type) where.type = type;
  if (isActive !== null) where.isActive = isActive === 'true';

  const sources = await prisma.benchmarkSource.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(sources);
}

// POST - Create new benchmark source
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add admin role check

  const body: BenchmarkSourceInput = await request.json();

  if (!body.name || !body.type) {
    return NextResponse.json(
      { error: 'Missing required fields: name, type' },
      { status: 400 }
    );
  }

  // Check for duplicate name
  const existing = await prisma.benchmarkSource.findUnique({
    where: { name: body.name },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'A source with this name already exists' },
      { status: 409 }
    );
  }

  const source = await prisma.benchmarkSource.create({
    data: {
      name: body.name,
      type: body.type,
      website: body.website || null,
      contactEmail: body.contactEmail || null,
      description: body.description || null,
      licenseType: body.licenseType || null,
      accessNotes: body.accessNotes || null,
      lastContacted: body.lastContacted ? new Date(body.lastContacted) : null,
      reliability: body.reliability || null,
      updateFrequency: body.updateFrequency || null,
    },
  });

  return NextResponse.json(source, { status: 201 });
}
