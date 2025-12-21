import { PrismaClient } from '@prisma/client';
import type { DemoTemplate } from '../../apps/web/src/lib/onboarding-constants';

const prisma = new PrismaClient();

interface GenerateDemoDataParams {
  datasetId: string;
  template: DemoTemplate;
  currency?: string;
}

export async function generateDemoData({
  datasetId,
  template,
  currency = 'EUR',
}: GenerateDemoDataParams) {
  const employees: any[] = [];

  // Helper to generate random variation in salaries (+/- 15%)
  const varyAmount = (amount: number): number => {
    const variation = amount * 0.15;
    return Math.round(amount + (Math.random() - 0.5) * 2 * variation);
  };

  // Generate employees based on role template
  template.roles.forEach((roleTemplate) => {
    for (let i = 0; i < roleTemplate.count; i++) {
      const baseSalary = varyAmount(roleTemplate.avgSalary);
      const bonus = Math.random() > 0.5 ? varyAmount(baseSalary * 0.1) : 0;
      const equity = roleTemplate.level === 'C_LEVEL' || roleTemplate.level === 'VP'
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

  return {
    employeesCreated: employees.length,
    totalCost: employees.reduce((sum, emp) => sum + emp.totalCompensation, 0),
    departments: Object.keys(template.departmentDistribution),
  };
}

// Helper functions
function getRandomPastDate(): Date {
  const monthsAgo = Math.floor(Math.random() * 36); // 0-36 months ago
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date;
}

function getRandomLocation(): string {
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
}

function getRandomGender(): 'MALE' | 'FEMALE' | 'DIVERSE' | 'PREFER_NOT_TO_SAY' {
  const random = Math.random();
  if (random < 0.45) return 'MALE';
  if (random < 0.90) return 'FEMALE';
  if (random < 0.95) return 'DIVERSE';
  return 'PREFER_NOT_TO_SAY';
}

export { prisma };
