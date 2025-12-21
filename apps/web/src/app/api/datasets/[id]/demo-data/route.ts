import { NextRequest, NextResponse } from 'next/server';
import { verifyDatasetAccess } from '@/lib/access-control';
import { getDemoTemplate } from '@/lib/onboarding-constants';
import { prisma } from '@scleorg/database';

export const runtime = 'nodejs';

/**
 * POST /api/datasets/[id]/demo-data
 * Generate demo employees for onboarding
 */
export async function POST(
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

    const body = await request.json();
    const { industry, growthStage } = body as { industry: string; growthStage: string };

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      );
    }

    // Get demo template (growthStage is optional, defaults to 'Seed')
    const template = getDemoTemplate(industry, growthStage || 'Seed');
    if (!template) {
      return NextResponse.json(
        { error: 'No demo template found for this industry/stage combination' },
        { status: 404 }
      );
    }

    // Helper to generate random variation (+/- 15%)
    const varyAmount = (amount: number): number => {
      const variation = amount * 0.15;
      return Math.round(amount + (Math.random() - 0.5) * 2 * variation);
    };

    // Helper to get random past date
    const getRandomPastDate = (): Date => {
      const monthsAgo = Math.floor(Math.random() * 36);
      const date = new Date();
      date.setMonth(date.getMonth() - monthsAgo);
      return date;
    };

    // Helper to get random location
    const getRandomLocation = (): string => {
      const locations = [
        'Berlin, Germany',
        'Munich, Germany',
        'Hamburg, Germany',
        'Frankfurt, Germany',
        'Vienna, Austria',
        'Zurich, Switzerland',
        'Amsterdam, Netherlands',
        'Paris, France',
        'London, UK',
        'Remote',
      ];
      return locations[Math.floor(Math.random() * locations.length)];
    };

    // Helper to get random gender
    const getRandomGender = (): 'MALE' | 'FEMALE' | 'DIVERSE' | 'PREFER_NOT_TO_SAY' => {
      const random = Math.random();
      if (random < 0.45) return 'MALE';
      if (random < 0.90) return 'FEMALE';
      if (random < 0.95) return 'DIVERSE';
      return 'PREFER_NOT_TO_SAY';
    };

    // Generate employees based on template
    const employees: any[] = [];

    template.roles.forEach((roleTemplate) => {
      for (let i = 0; i < roleTemplate.count; i++) {
        const baseSalary = varyAmount(roleTemplate.avgSalary);
        const bonus =
          Math.random() > 0.5 ? varyAmount(baseSalary * 0.1) : 0;
        const equity =
          roleTemplate.level === 'C_LEVEL' || roleTemplate.level === 'VP'
            ? varyAmount(baseSalary * 0.2)
            : roleTemplate.level === 'MANAGER'
            ? varyAmount(baseSalary * 0.1)
            : 0;

        employees.push({
          datasetId,
          employeeName: `${roleTemplate.title} ${i + 1}`,
          department: roleTemplate.department,
          role: roleTemplate.title,
          level: roleTemplate.level,
          employmentType: 'FTE',
          fteFactor: 1.0,
          annualSalary: baseSalary,
          bonus,
          equityValue: equity,
          totalCompensation: baseSalary + bonus + equity,
          startDate: getRandomPastDate(),
          location: getRandomLocation(),
          gender: getRandomGender(),
        });
      }
    });

    // Bulk create employees
    await prisma.employee.createMany({
      data: employees,
    });

    // Mark dataset as demo
    await prisma.dataset.update({
      where: { id: datasetId },
      data: { isDemo: true },
    });

    return NextResponse.json({
      success: true,
      employeesCreated: employees.length,
      totalCost: employees.reduce((sum, emp) => sum + emp.totalCompensation, 0),
      departments: Object.keys(template.departmentDistribution),
    });
  } catch (error) {
    console.error('Error generating demo data:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate demo data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
