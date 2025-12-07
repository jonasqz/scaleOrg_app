import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';
import { calculateAllMetrics } from '@scleorg/calculations';
import { DEFAULT_BENCHMARKS, getBenchmarkForSegment, compareToBenchmark } from '@scleorg/calculations';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Get dataset with employees
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        employees: true,
        settings: true,
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    if (dataset.employees.length === 0) {
      return NextResponse.json(
        { error: 'No employees in dataset' },
        { status: 400 }
      );
    }

    // Get department categories from settings
    const departmentCategories = dataset.settings?.departmentCategories as Record<string, string> | undefined;

    // Calculate metrics
    const metrics = calculateAllMetrics(dataset.employees, dataset, departmentCategories);

    // Determine company size based on employee count
    let companySize = '50-100';
    const empCount = metrics.summary.employeeCount;
    if (empCount >= 500) companySize = '500+';
    else if (empCount >= 250) companySize = '250-500';
    else if (empCount >= 100) companySize = '100-250';

    // Get benchmark data
    const benchmark = getBenchmarkForSegment(
      'saas_b2b',
      companySize,
      DEFAULT_BENCHMARKS
    );

    if (!benchmark) {
      return NextResponse.json(
        { error: 'No benchmark data available' },
        { status: 404 }
      );
    }

    // Ensure benchmark has required fields
    const benchmarkData = {
      segment: benchmark.industry || 'saas_b2b',
      companySize: benchmark.companySize || companySize,
      source: benchmark.source || 'industry_data',
      metrics: benchmark.metrics,
    };

    // Compare metrics to benchmarks
    const comparisons = {
      rdToGTM: benchmark.metrics.rdToGTMRatio
        ? compareToBenchmark(metrics.ratios.rdToGTM, benchmark.metrics.rdToGTMRatio)
        : null,
      revenuePerFTE:
        metrics.summary.revenuePerFTE && benchmark.metrics.revenuePerFTE
          ? compareToBenchmark(
              metrics.summary.revenuePerFTE,
              benchmark.metrics.revenuePerFTE
            )
          : null,
      spanOfControl: benchmark.metrics.spanOfControl
        ? compareToBenchmark(
            metrics.ratios.avgSpanOfControl,
            benchmark.metrics.spanOfControl
          )
        : null,
      costPerFTE: benchmark.metrics.costPerFTE
        ? compareToBenchmark(
            metrics.summary.costPerFTE,
            benchmark.metrics.costPerFTE
          )
        : null,
    };

    return NextResponse.json({
      metrics,
      benchmark: benchmarkData,
      comparisons,
      companySize,
    });
  } catch (error) {
    console.error('Error fetching benchmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks' },
      { status: 500 }
    );
  }
}
