import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@scleorg/database';
import type { AffectedEmployee } from '@scleorg/types';
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
    const { type, adjustments, reductionPct, targetDepartments, additionalFTE, distribution, targetRatio, currentCash, includeTimeline, revenueGrowthRate, customRevenue } = body;

    const baselineEmployees = dataset.employees.filter((emp: any) => !emp.endDate);
    let scenarioEmployees = [...baselineEmployees];
    const affectedEmployees: AffectedEmployee[] = [];

    // Fetch existing revenue data
    const monthlyRevenues = await prisma.monthlyRevenue.findMany({
      where: {
        datasetId: params.id,
      },
      orderBy: {
        period: 'asc',
      },
    });

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

        // Track removed employees
        const removedIds = new Set(scenarioEmployees.map((e: any) => e.id));
        baselineEmployees.forEach((emp: any) => {
          if (!removedIds.has(emp.id)) {
            affectedEmployees.push({
              id: emp.id,
              employeeId: emp.employeeId,
              employeeName: emp.employeeName,
              department: emp.department,
              role: emp.role,
              totalCompensation: Number(emp.totalCompensation),
              action: 'remove',
              effectiveDate: null, // Will be set by frontend or default
            });
          }
        });
        break;

      case 'growth':
        if (additionalFTE && distribution) {
          scenarioEmployees = applyGrowth(
            baselineEmployees,
            additionalFTE,
            distribution
          );

          // Track new hires
          const baselineIds = new Set(baselineEmployees.map((e: any) => e.id));
          scenarioEmployees.forEach((emp: any) => {
            if (!baselineIds.has(emp.id)) {
              affectedEmployees.push({
                id: emp.id,
                employeeId: emp.employeeId,
                employeeName: emp.employeeName,
                department: emp.department,
                role: emp.role,
                totalCompensation: Number(emp.totalCompensation),
                action: 'add',
                effectiveDate: null, // Will be set by frontend or default
                isNew: true,
              });
            }
          });
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
          const employeesByDept = baselineEmployees.reduce((acc: any, emp: any) => {
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
              const sorted = [...deptEmps].sort((a: any, b: any) =>
                Number(b.totalCompensation) - Number(a.totalCompensation)
              );
              const numToRemove = Math.abs(changeNum);

              // Track removed employees
              sorted.slice(0, numToRemove).forEach((emp: any) => {
                affectedEmployees.push({
                  id: emp.id,
                  employeeId: emp.employeeId,
                  employeeName: emp.employeeName,
                  department: emp.department,
                  role: emp.role,
                  totalCompensation: Number(emp.totalCompensation),
                  action: 'remove',
                  effectiveDate: null,
                });
              });

              // Skip the first numToRemove (highest paid) and keep the rest
              scenarioEmployees.push(...sorted.slice(numToRemove));
            } else if (changeNum > 0) {
              // Add employees
              scenarioEmployees.push(...deptEmps);

              const avgComp = deptEmps.length > 0
                ? deptEmps.reduce((sum: number, e: any) => sum + Number(e.totalCompensation), 0) / deptEmps.length
                : 100000;

              for (let i = 0; i < changeNum; i++) {
                const newHire = {
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
                } as any;

                scenarioEmployees.push(newHire);

                // Track new hire
                affectedEmployees.push({
                  id: newHire.id,
                  employeeId: newHire.employeeId,
                  employeeName: newHire.employeeName,
                  department: newHire.department,
                  role: newHire.role,
                  totalCompensation: avgComp,
                  action: 'add',
                  effectiveDate: null,
                  isNew: true,
                });
              }
            } else {
              // No change
              scenarioEmployees.push(...deptEmps);
            }
          });

          // Add departments that weren't adjusted
          Object.entries(employeesByDept).forEach(([dept, emps]: [string, any]) => {
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

    // Prepare revenue projections for scenario
    const revenueProjections = customRevenue || (revenueGrowthRate ? calculateRevenueProjections(monthlyRevenues, revenueGrowthRate) : null);

    // Calculate metrics for both baseline and scenario
    const result = calculateScenarioMetrics(
      baselineEmployees,
      scenarioEmployees,
      dataset.totalRevenue ? Number(dataset.totalRevenue) : null,
      {
        includeTimeline: includeTimeline !== false, // Default to true
        currentCash: currentCash ? Number(currentCash) : (dataset.currentCashBalance ? Number(dataset.currentCashBalance) : undefined),
        affectedEmployees: affectedEmployees.length > 0 ? affectedEmployees : undefined,
        revenueProjections,
        monthlyRevenues: monthlyRevenues.map(r => ({
          period: r.period.toISOString().split('T')[0],
          revenue: Number(r.revenue),
        })),
      }
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

// Helper function to calculate revenue projections with growth rate
function calculateRevenueProjections(
  existingRevenues: any[],
  growthRate: number
): { period: string; revenue: number }[] {
  const projections: { period: string; revenue: number }[] = [];
  const now = new Date();

  // Get most recent revenue or use 0
  const latestRevenue = existingRevenues.length > 0
    ? Number(existingRevenues[existingRevenues.length - 1].revenue)
    : 0;

  // Project 12 months forward
  let currentRevenue = latestRevenue;
  const monthlyGrowthMultiplier = 1 + (growthRate / 100);

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const period = date.toISOString().split('T')[0];

    // Apply growth
    if (i > 0) {
      currentRevenue = currentRevenue * monthlyGrowthMultiplier;
    }

    projections.push({
      period,
      revenue: currentRevenue,
    });
  }

  return projections;
}
