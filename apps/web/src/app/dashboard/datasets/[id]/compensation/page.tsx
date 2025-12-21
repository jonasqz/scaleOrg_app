import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@scleorg/database';
import CompensationPlanningClient from './compensation-planning-client';

export default async function CompensationPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const dataset = await prisma.dataset.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
    include: {
      employees: {
        where: {
          endDate: null, // Only active employees
        },
        include: {
          compensationTargets: true,
          monthlyPlannedCompensation: {
            orderBy: { period: 'asc' },
          },
        },
        orderBy: [
          { department: 'asc' },
          { employeeName: 'asc' },
        ],
      },
      compensationScenarios: {
        where: {
          isActive: true,
        },
        include: {
          targets: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      settings: true,
    },
  });

  if (!dataset) {
    notFound();
  }

  // Get or create baseline scenario
  let baselineScenario = dataset.compensationScenarios.find(s => s.isBaseline);
  if (!baselineScenario) {
    baselineScenario = await prisma.compensationScenario.create({
      data: {
        datasetId: dataset.id,
        name: 'Baseline',
        description: 'Current compensation baseline',
        isBaseline: true,
        status: 'APPROVED',
      },
      include: {
        targets: true,
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">Employee Compensation</h1>
        <p className="mt-1 text-xs text-stone-500">
          View current compensation (IS), target benchmarks (SHOULD), and forecasted adjustments (FORECAST)
        </p>
      </div>

      {/* Main Component */}
      <CompensationPlanningClient
        datasetId={dataset.id}
        currency={dataset.currency}
        employees={dataset.employees.map(emp => ({
          ...emp,
          totalCompensation: Number(emp.totalCompensation),
          annualSalary: emp.annualSalary ? Number(emp.annualSalary) : null,
          bonus: emp.bonus ? Number(emp.bonus) : null,
          equityValue: emp.equityValue ? Number(emp.equityValue) : null,
          fteFactor: Number(emp.fteFactor),
          compensationTargets: emp.compensationTargets.map(target => ({
            ...target,
            targetAnnualComp: Number(target.targetAnnualComp),
          })),
          monthlyPlannedCompensation: emp.monthlyPlannedCompensation.map(mpc => ({
            ...mpc,
            plannedTotalEmployerCost: Number(mpc.plannedTotalEmployerCost),
            plannedGrossTotal: Number(mpc.plannedGrossTotal),
          })),
        }))}
        scenarios={dataset.compensationScenarios.map(scenario => ({
          ...scenario,
          targets: scenario.targets.map(target => ({
            ...target,
            targetAnnualComp: Number(target.targetAnnualComp),
          })),
        }))}
        baselineScenarioId={baselineScenario.id}
      />
    </div>
  );
}
