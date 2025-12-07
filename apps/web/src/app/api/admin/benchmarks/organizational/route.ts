// Admin API for managing organizational benchmarks
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';
import type { OrganizationalBenchmarkInput } from '@scleorg/types';

// GET - List organizational benchmarks with filtering
export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add admin role check
  // For now, any authenticated user can view

  const { searchParams } = new URL(request.url);
  const industry = searchParams.get('industry');
  const region = searchParams.get('region');
  const companySize = searchParams.get('companySize');
  const benchmarkType = searchParams.get('benchmarkType');
  const metricName = searchParams.get('metricName');
  const effectiveAsOf = searchParams.get('effectiveAsOf');

  const where: any = {};

  if (industry) where.industry = industry;
  if (region) where.region = region;
  if (companySize) where.companySize = companySize;
  if (benchmarkType) where.benchmarkType = benchmarkType;
  if (metricName) where.metricName = metricName;

  // Filter by effective date
  if (effectiveAsOf) {
    const asOfDate = new Date(effectiveAsOf);
    where.effectiveDate = { lte: asOfDate };
    where.OR = [
      { expirationDate: null },
      { expirationDate: { gte: asOfDate } }
    ];
  }

  const benchmarks = await prisma.organizationalBenchmark.findMany({
    where,
    include: {
      source: true,
    },
    orderBy: [
      { effectiveDate: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return NextResponse.json(benchmarks);
}

// POST - Create new organizational benchmark
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add admin role check

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body: OrganizationalBenchmarkInput = await request.json();

  // Validate required fields
  if (!body.industry || !body.region || !body.companySize || !body.benchmarkType || !body.metricName) {
    return NextResponse.json(
      { error: 'Missing required fields: industry, region, companySize, benchmarkType, metricName' },
      { status: 400 }
    );
  }

  if (!body.sampleSize || body.sampleSize < 1) {
    return NextResponse.json(
      { error: 'Sample size must be at least 1' },
      { status: 400 }
    );
  }

  // Create the benchmark
  const benchmark = await prisma.organizationalBenchmark.create({
    data: {
      industry: body.industry,
      region: body.region,
      companySize: body.companySize,
      growthStage: body.growthStage || null,
      benchmarkType: body.benchmarkType,
      metricName: body.metricName,
      p10Value: body.p10Value || null,
      p25Value: body.p25Value || null,
      p50Value: body.p50Value || null,
      p75Value: body.p75Value || null,
      p90Value: body.p90Value || null,
      departmentData: body.departmentData || null,
      sampleSize: body.sampleSize,
      currency: body.currency || null,
      unit: body.unit || null,
      sourceId: body.sourceId || null,
      effectiveDate: new Date(body.effectiveDate),
      expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
      notes: body.notes || null,
      methodology: body.methodology || null,
    },
    include: {
      source: true,
    },
  });

  // Create audit log
  await prisma.benchmarkAuditLog.create({
    data: {
      resourceType: 'OrganizationalBenchmark',
      resourceId: benchmark.id,
      action: 'CREATE',
      userId: user.id,
      sourceId: body.sourceId || null,
      newData: benchmark,
      changeReason: 'New benchmark created via admin API',
    },
  });

  return NextResponse.json(benchmark, { status: 201 });
}
