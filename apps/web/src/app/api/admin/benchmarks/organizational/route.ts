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
  const entryMode = searchParams.get('entryMode');
  const benchmarkType = searchParams.get('benchmarkType');
  const metricName = searchParams.get('metricName');
  const effectiveAsOf = searchParams.get('effectiveAsOf');
  const approvalStatus = searchParams.get('approvalStatus'); // PENDING, APPROVED, REJECTED

  const where: any = {};

  if (industry) where.industry = industry;
  if (region) where.region = region;
  if (companySize) where.companySize = companySize;
  if (entryMode) where.entryMode = entryMode;
  if (benchmarkType) where.benchmarkType = benchmarkType;
  if (metricName) where.metricName = metricName;
  if (approvalStatus) where.approvalStatus = approvalStatus;

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

  const body: any = await request.json();

  // Validate required fields (common to both modes)
  if (!body.industry || !body.region || !body.companySize) {
    return NextResponse.json(
      { error: 'Missing required fields: industry, region, companySize' },
      { status: 400 }
    );
  }

  if (!body.sampleSize || body.sampleSize < 1) {
    return NextResponse.json(
      { error: 'Sample size must be at least 1' },
      { status: 400 }
    );
  }

  // Validate based on entry mode
  const entryMode = body.entryMode || 'FALLBACK';

  if (entryMode === 'DETAILED') {
    // DETAILED mode: Department headcount required
    if (!body.departmentHeadcount || !body.departmentHeadcount.p50) {
      return NextResponse.json(
        { error: 'DETAILED mode requires departmentHeadcount with at least p50 data' },
        { status: 400 }
      );
    }
  } else {
    // FALLBACK mode: benchmarkType, metricName, and p50Value required
    if (!body.benchmarkType || !body.metricName) {
      return NextResponse.json(
        { error: 'FALLBACK mode requires benchmarkType and metricName' },
        { status: 400 }
      );
    }
    if (body.p50Value === undefined || body.p50Value === null) {
      return NextResponse.json(
        { error: 'FALLBACK mode requires p50Value (median)' },
        { status: 400 }
      );
    }
  }

  // Determine approval status:
  // - If sourceId points to THIRD_PARTY source, auto-approve
  // - If sourceId points to CROWDSOURCED source, set as PENDING
  // - If manually entered, set based on body.approvalStatus or default to PENDING
  let approvalStatus = body.approvalStatus || 'PENDING';

  if (body.sourceId) {
    const source = await prisma.benchmarkSource.findUnique({
      where: { id: body.sourceId },
      select: { type: true },
    });

    if (source?.type === 'THIRD_PARTY') {
      approvalStatus = 'APPROVED'; // Auto-approve trusted third-party data
    }
  }

  // Build the data object based on entry mode
  const data: any = {
    industry: body.industry,
    region: body.region,
    companySize: body.companySize,
    growthStage: body.growthStage || null,
    entryMode,
    sampleSize: body.sampleSize,
    sourceId: body.sourceId || null,
    effectiveDate: new Date(body.effectiveDate),
    expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
    approvalStatus,
    notes: body.notes || null,
    methodology: body.methodology || null,
  };

  if (entryMode === 'DETAILED') {
    // DETAILED mode: Store department headcount
    data.departmentHeadcount = body.departmentHeadcount;
    if (body.revenueData) {
      data.revenueData = body.revenueData;
    }
    // benchmarkType and metricName are null in DETAILED mode
    data.benchmarkType = null;
    data.metricName = null;
  } else {
    // FALLBACK mode: Store direct metric values
    data.benchmarkType = body.benchmarkType;
    data.metricName = body.metricName;
    data.p10Value = body.p10Value || null;
    data.p25Value = body.p25Value || null;
    data.p50Value = body.p50Value;
    data.p75Value = body.p75Value || null;
    data.p90Value = body.p90Value || null;
    data.unit = body.unit || null;
    data.currency = body.currency || null;
  }

  // Create the benchmark
  const benchmark = await prisma.organizationalBenchmark.create({
    data,
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
