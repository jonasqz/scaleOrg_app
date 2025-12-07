// API endpoint to fetch organizational benchmarks for a dataset
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';
import { calculateMetricsFromHeadcount } from '@scleorg/calculations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const datasetId = params.id;

  // Fetch the dataset with minimal data - we only need user info, revenue, employee count, and settings
  // We don't need to re-fetch all employees since metrics are already calculated client-side
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    select: {
      id: true,
      totalRevenue: true,
      user: {
        select: {
          clerkId: true,
          industry: true,
        },
      },
      settings: {
        select: {
          industry: true,
          region: true,
          growthStage: true,
        },
      },
      _count: {
        select: {
          employees: true,
        },
      },
      employees: {
        select: {
          level: true,
        },
      },
    },
  });

  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  // Verify ownership
  if (dataset.user.clerkId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Determine company size range
  const totalEmployees = dataset._count.employees;
  let companySize = '';
  if (totalEmployees <= 10) companySize = '1-10';
  else if (totalEmployees <= 50) companySize = '11-50';
  else if (totalEmployees <= 200) companySize = '51-200';
  else if (totalEmployees <= 500) companySize = '201-500';
  else if (totalEmployees <= 1000) companySize = '501-1000';
  else if (totalEmployees <= 5000) companySize = '1001-5000';
  else companySize = '5000+';

  // Use dataset-level settings if available, otherwise fall back to user-level
  const industry = dataset.settings?.industry || dataset.user.industry || 'SaaS';
  const region = dataset.settings?.region || 'Global'; // Default to Global if not specified
  const growthStage = dataset.settings?.growthStage;

  // Build benchmark query - prioritize exact matches, then broaden if needed
  const whereClause: any = {
    industry,
    companySize,
    effectiveDate: { lte: new Date() },
    approvalStatus: 'APPROVED', // Only show approved benchmarks
    OR: [
      { expirationDate: null },
      { expirationDate: { gte: new Date() } },
    ],
  };

  // Add region filter if specified (not Global)
  if (region && region !== 'Global') {
    whereClause.region = region;
  }

  // Add growth stage filter if specified
  if (growthStage) {
    whereClause.growthStage = growthStage;
  }

  let benchmarks = await prisma.organizationalBenchmark.findMany({
    where: whereClause,
    orderBy: [
      { effectiveDate: 'desc' },
    ],
  });

  // If no exact matches, try broader search
  if (benchmarks.length === 0) {
    benchmarks = await prisma.organizationalBenchmark.findMany({
      where: {
        companySize,
        effectiveDate: { lte: new Date() },
        approvalStatus: 'APPROVED', // Only show approved benchmarks
        OR: [
          { expirationDate: null },
          { expirationDate: { gte: new Date() } },
        ],
      },
      orderBy: [
        { effectiveDate: 'desc' },
      ],
      take: 10,
    });
  }

  if (benchmarks.length === 0) {
    return NextResponse.json(
      { error: 'No matching benchmarks found for your industry and company size' },
      { status: 404 }
    );
  }

  // Extract benchmark metrics from both DETAILED and FALLBACK modes
  const benchmarkMetrics: Record<string, { p25: number; p50: number; p75: number }> = {};

  benchmarks.forEach((benchmark) => {
    if (benchmark.entryMode === 'DETAILED' && benchmark.departmentHeadcount) {
      const headcountData = benchmark.departmentHeadcount as any;

      if (headcountData.p50) {
        const p50Metrics = calculateMetricsFromHeadcount(headcountData.p50);

        // Store R&D to GTM ratio
        if (!benchmarkMetrics['rd_to_gtm_ratio']) {
          benchmarkMetrics['rd_to_gtm_ratio'] = {
            p25: headcountData.p25 ? calculateMetricsFromHeadcount(headcountData.p25).rd_to_gtm_ratio : p50Metrics.rd_to_gtm_ratio,
            p50: p50Metrics.rd_to_gtm_ratio,
            p75: headcountData.p75 ? calculateMetricsFromHeadcount(headcountData.p75).rd_to_gtm_ratio : p50Metrics.rd_to_gtm_ratio,
          };
        }
      }
    } else if (benchmark.entryMode === 'FALLBACK' && benchmark.metricName) {
      const metricName = benchmark.metricName;
      if (benchmark.p50Value) {
        benchmarkMetrics[metricName] = {
          p25: Number(benchmark.p25Value) || Number(benchmark.p50Value),
          p50: Number(benchmark.p50Value),
          p75: Number(benchmark.p75Value) || Number(benchmark.p50Value),
        };
      }
    }
  });

  // Build simplified response - just return benchmark data
  // Client-side already has metrics, no need to recalculate or compare
  const response = {
    benchmark: {
      segment: industry,
      region,
      companySize,
      growthStage: growthStage || null,
      metrics: {
        rdToGTMRatio: benchmarkMetrics['rd_to_gtm_ratio'] || null,
        revenuePerFTE: benchmarkMetrics['revenue_per_fte'] || null,
        spanOfControl: benchmarkMetrics['span_of_control'] || null,
        costPerFTE: benchmarkMetrics['cost_per_fte'] || null,
      },
    },
    companySize,
  };

  return NextResponse.json(response);
}
