import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';

// GET /api/admin/benchmarks/compensation - List all compensation benchmarks
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here when roles are implemented
    // For now, all authenticated users can view

    const { searchParams } = new URL(request.url);
    const roleFamily = searchParams.get('roleFamily');
    const industry = searchParams.get('industry');
    const region = searchParams.get('region');
    const companySize = searchParams.get('companySize');
    const seniorityLevel = searchParams.get('seniorityLevel');

    // Build filter
    const where: any = {};
    if (roleFamily) where.roleFamily = roleFamily;
    if (industry) where.industry = industry;
    if (region) where.region = region;
    if (companySize) where.companySize = companySize;
    if (seniorityLevel) where.seniorityLevel = seniorityLevel;

    const benchmarks = await prisma.compensationBenchmark.findMany({
      where,
      orderBy: [
        { roleFamily: 'asc' },
        { seniorityLevel: 'asc' },
        { industry: 'asc' },
        { region: 'asc' },
      ],
    });

    // Also get unique values for filters
    const uniqueRoleFamilies = await prisma.compensationBenchmark.findMany({
      select: { roleFamily: true },
      distinct: ['roleFamily'],
    });
    const uniqueIndustries = await prisma.compensationBenchmark.findMany({
      select: { industry: true },
      distinct: ['industry'],
    });
    const uniqueRegions = await prisma.compensationBenchmark.findMany({
      select: { region: true },
      distinct: ['region'],
    });
    const uniqueCompanySizes = await prisma.compensationBenchmark.findMany({
      select: { companySize: true },
      distinct: ['companySize'],
    });
    const uniqueSeniorityLevels = await prisma.compensationBenchmark.findMany({
      select: { seniorityLevel: true },
      distinct: ['seniorityLevel'],
    });

    return NextResponse.json({
      benchmarks,
      filters: {
        roleFamilies: uniqueRoleFamilies.map((r) => r.roleFamily).sort(),
        industries: uniqueIndustries.map((i) => i.industry).sort(),
        regions: uniqueRegions.map((r) => r.region).sort(),
        companySizes: uniqueCompanySizes.map((c) => c.companySize).sort(),
        seniorityLevels: uniqueSeniorityLevels.map((s) => s.seniorityLevel).sort(),
      },
    });
  } catch (error) {
    console.error('Error fetching compensation benchmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compensation benchmarks' },
      { status: 500 }
    );
  }
}

// POST /api/admin/benchmarks/compensation - Create new compensation benchmark
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here

    const body = await request.json();

    // Validation
    const required = [
      'roleFamily',
      'standardizedTitle',
      'seniorityLevel',
      'industry',
      'region',
      'companySize',
      'currency',
      'sampleSize',
    ];

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // At least p50 (median) should be provided
    if (!body.p50TotalComp && !body.p50BaseSalary) {
      return NextResponse.json(
        { error: 'At least p50TotalComp or p50BaseSalary must be provided' },
        { status: 400 }
      );
    }

    const benchmark = await prisma.compensationBenchmark.create({
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

    return NextResponse.json(benchmark, { status: 201 });
  } catch (error) {
    console.error('Error creating compensation benchmark:', error);
    return NextResponse.json(
      { error: 'Failed to create compensation benchmark' },
      { status: 500 }
    );
  }
}
