import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';
import {
  applyHiringFreeze,
  applyCostReduction,
  applyGrowth,
  applyTargetRatio,
  calculateScenarioMetrics,
} from '@scleorg/calculations';

export async function POST(
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

    // Verify dataset ownership
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        employees: true,
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const body = await request.json();
    const { type, adjustments, reductionPct, targetDepartments, additionalFTE, distribution, targetRatio } = body;

    const baselineEmployees = dataset.employees.filter(emp => !emp.endDate);
    let scenarioEmployees = [...baselineEmployees];

    // Apply transformation based on scenario type
    switch (type) {
      case 'hiring_freeze':
        // For now, hiring freeze just keeps current employees (no open roles in this MVP)
        scenarioEmployees = baselineEmployees;
        break;

      case 'cost_reduction':
        scenarioEmployees = applyCostReduction(
          baselineEmployees,
          reductionPct || 10,
          targetDepartments
        );
        break;

      case 'growth':
        if (additionalFTE && distribution) {
          scenarioEmployees = applyGrowth(
            baselineEmployees,
            additionalFTE,
            distribution
          );
        }
        break;

      case 'target_ratio':
        if (targetRatio) {
          scenarioEmployees = applyTargetRatio(
            baselineEmployees,
            targetRatio
          );
        }
        break;

      case 'custom':
        // Custom adjustments: add/remove employees by department
        if (adjustments && Object.keys(adjustments).length > 0) {
          const employeesByDept = baselineEmployees.reduce((acc, emp) => {
            if (!acc[emp.department]) acc[emp.department] = [];
            acc[emp.department].push(emp);
            return acc;
          }, {} as { [key: string]: typeof baselineEmployees });

          scenarioEmployees = [];

          Object.entries(adjustments).forEach(([dept, change]) => {
            const deptEmps = employeesByDept[dept] || [];
            const changeNum = Number(change);

            if (changeNum < 0) {
              // Remove employees (highest paid first)
              const sorted = [...deptEmps].sort((a, b) =>
                Number(b.totalCompensation) - Number(a.totalCompensation)
              );
              const numToRemove = Math.abs(changeNum);
              // Skip the first numToRemove (highest paid) and keep the rest
              scenarioEmployees.push(...sorted.slice(numToRemove));
            } else if (changeNum > 0) {
              // Add employees
              scenarioEmployees.push(...deptEmps);

              const avgComp = deptEmps.length > 0
                ? deptEmps.reduce((sum, e) => sum + Number(e.totalCompensation), 0) / deptEmps.length
                : 100000;

              for (let i = 0; i < changeNum; i++) {
                scenarioEmployees.push({
                  id: `new_${dept}_${i}`,
                  datasetId: dataset.id,
                  employeeId: `NEW_${dept}_${i}`,
                  employeeName: `New Hire ${i + 1}`,
                  department: dept,
                  employmentType: 'FTE',
                  fteFactor: 1.0 as any,
                  annualSalary: avgComp as any,
                  totalCompensation: avgComp as any,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  level: null,
                  role: null,
                  managerId: null,
                  costCenter: null,
                  location: null,
                  email: null,
                  bonus: null,
                  equityValue: null,
                  startDate: null,
                  endDate: null,
                } as any);
              }
            } else {
              // No change
              scenarioEmployees.push(...deptEmps);
            }
          });

          // Add departments that weren't adjusted
          Object.entries(employeesByDept).forEach(([dept, emps]) => {
            if (!(dept in adjustments)) {
              scenarioEmployees.push(...emps);
            }
          });
        } else {
          // No adjustments, use baseline
          scenarioEmployees = baselineEmployees;
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid scenario type' }, { status: 400 });
    }

    // Calculate metrics for both baseline and scenario
    const result = calculateScenarioMetrics(
      baselineEmployees,
      scenarioEmployees,
      dataset.totalRevenue ? Number(dataset.totalRevenue) : null
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scenario error:', error);
    return NextResponse.json(
      { error: 'Failed to run scenario' },
      { status: 500 }
    );
  }
}
