import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';
import { verifyDatasetAccess } from '@/lib/access-control';
import { calculateHealthScore, KPI_REGISTRY } from '@scleorg/calculations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/datasets/[id]/health-score
 *
 * Calculate and return organizational health score
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: datasetId } = await params;

    // Verify access
    const dataset = await verifyDatasetAccess(datasetId);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Load dataset settings
    const settings = await prisma.datasetSettings.findUnique({
      where: { datasetId },
    });

    // Fetch employees
    const employees = await prisma.employee.findMany({
      where: { datasetId },
    });

    if (employees.length === 0) {
      return NextResponse.json({
        error: 'No employees found in dataset',
      }, { status: 400 });
    }

    // Fetch monthly employer costs for cost management metrics
    const monthlyEmployerCosts = await prisma.monthlyEmployerCost.findMany({
      where: {
        datasetId,
        employeeId: null, // Only aggregated data
      },
      orderBy: {
        period: 'desc',
      },
      take: 12, // Last 12 months
    });

    // Fetch monthly planned compensation for budget variance
    const monthlyPlannedCompensation = await prisma.monthlyPlannedCompensation.findMany({
      where: { datasetId },
      orderBy: {
        period: 'desc',
      },
      take: 12,
    });

    // Build benchmarks map from KPI registry
    const benchmarks: Record<string, { low: number; median: number; high: number }> = {};
    Object.entries(KPI_REGISTRY).forEach(([kpiId, kpiDef]) => {
      if (kpiDef.benchmarkRange) {
        benchmarks[kpiId] = {
          low: kpiDef.benchmarkRange.low,
          median: kpiDef.benchmarkRange.median,
          high: kpiDef.benchmarkRange.high,
        };
      }
    });

    // TODO: Fetch previous health score for trend calculation
    // This would require storing health score snapshots in the database
    const previousScore = undefined;

    // Calculate health score
    const healthScore = calculateHealthScore({
      employees,
      metadata: {
        totalRevenue: dataset.totalRevenue ? Number(dataset.totalRevenue) : undefined,
        currency: dataset.currency,
        currentCashBalance: dataset.currentCashBalance ? Number(dataset.currentCashBalance) : undefined,
      },
      benchmarks,
      departmentCategories: settings?.departmentCategories as Record<string, string> | undefined,
      previousScore,
      monthlyEmployerCosts: monthlyEmployerCosts.map((cost) => ({
        period: cost.period,
        totalCost: Number(cost.totalEmployerCost),
        avgCostPerEmployee: Number(cost.totalEmployerCost) / employees.length,
        avgCostRatio: cost.employerCostRatio ? Number(cost.employerCostRatio) : undefined,
      })),
      monthlyPlannedCompensation,
    });

    // Serialize the health score (convert Date to string)
    const serializedHealthScore = {
      ...healthScore,
      calculatedAt: healthScore.calculatedAt.toISOString(),
    };

    return NextResponse.json({
      healthScore: serializedHealthScore,
    });
  } catch (error) {
    console.error('Error calculating health score:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate health score',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
