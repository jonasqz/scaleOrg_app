import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';
import { calculateTargetCompensation } from '@scleorg/calculations';

export async function POST(
  request: NextRequest,
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

    // Get request body
    const body = await request.json();
    const { scenarioId, targetPercentile = 'p50', companySize } = body;

    // Validate dataset access
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        settings: true,
        employees: {
          where: {
            endDate: null,
          },
        },
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Validate scenario
    const scenario = await prisma.compensationScenario.findFirst({
      where: {
        id: scenarioId,
        datasetId: dataset.id,
      },
    });

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    // Get all available benchmarks
    const benchmarks = await prisma.compensationBenchmark.findMany({
      where: {
        // Optionally filter by dataset settings
        ...(dataset.settings?.industry && { industry: dataset.settings.industry as string }),
        ...(dataset.settings?.region && { region: dataset.settings.region as string }),
      },
    });

    // Convert benchmarks to the format expected by the calculation function
    const formattedBenchmarks = benchmarks.map(b => ({
      id: b.id,
      roleFamily: b.roleFamily,
      standardizedTitle: b.standardizedTitle,
      seniorityLevel: b.seniorityLevel,
      industry: b.industry,
      region: b.region,
      companySize: b.companySize,
      p10TotalComp: b.p10TotalComp ? Number(b.p10TotalComp) : null,
      p25TotalComp: b.p25TotalComp ? Number(b.p25TotalComp) : null,
      p50TotalComp: b.p50TotalComp ? Number(b.p50TotalComp) : null,
      p75TotalComp: b.p75TotalComp ? Number(b.p75TotalComp) : null,
      p90TotalComp: b.p90TotalComp ? Number(b.p90TotalComp) : null,
      sampleSize: b.sampleSize,
      currency: b.currency,
    }));

    // Convert employees to the format expected by the calculation function
    const formattedEmployees = dataset.employees.map(e => ({
      id: e.id,
      employeeName: e.employeeName,
      role: e.role,
      level: e.level,
      department: e.department,
      location: e.location,
      totalCompensation: Number(e.totalCompensation),
    }));

    // Determine company size (use provided or infer from employee count)
    const finalCompanySize =
      companySize || inferCompanySize(dataset.employees.length);

    // Calculate targets
    const targets = calculateTargetCompensation(
      formattedEmployees,
      formattedBenchmarks,
      dataset.settings
        ? {
            industry: dataset.settings.industry as string | undefined,
            region: dataset.settings.region as string | undefined,
          }
        : null,
      finalCompanySize,
      targetPercentile
    );

    // Save targets to database
    const createPromises = targets.map(target =>
      prisma.employeeCompensationTarget.upsert({
        where: {
          employeeId_scenarioId: {
            employeeId: target.employeeId,
            scenarioId: scenario.id,
          },
        },
        update: {
          targetAnnualComp: target.targetAnnualComp,
          calculationMethod: target.calculationMethod,
          benchmarkSource: target.benchmarkSource,
          explanation: target.explanation,
          isManualOverride: false,
        },
        create: {
          employeeId: target.employeeId,
          scenarioId: scenario.id,
          targetAnnualComp: target.targetAnnualComp,
          calculationMethod: target.calculationMethod,
          benchmarkSource: target.benchmarkSource,
          explanation: target.explanation,
          isManualOverride: false,
        },
      })
    );

    await Promise.all(createPromises);

    return NextResponse.json({
      success: true,
      message: `Calculated targets for ${targets.length} employees`,
      targetsCreated: targets.length,
    });
  } catch (error) {
    console.error('Error auto-calculating compensation targets:', error);
    return NextResponse.json(
      { error: 'Failed to calculate targets' },
      { status: 500 }
    );
  }
}

function inferCompanySize(employeeCount: number): string {
  if (employeeCount < 11) return '1-10';
  if (employeeCount < 51) return '11-50';
  if (employeeCount < 201) return '51-200';
  if (employeeCount < 501) return '201-500';
  if (employeeCount < 1001) return '501-1000';
  return '1000+';
}
