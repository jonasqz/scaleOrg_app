// API endpoint to fetch compensation benchmarks for individual employees
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@scleorg/database';

interface EmployeeBenchmarkData {
  id: string;
  name: string;
  role: string;
  level: string;
  totalCompensation: number;
  benchmark: {
    p25: number;
    p50: number;
    p75: number;
    currency: string;
  } | null;
  marketPosition: {
    percentDiff: number; // e.g. +8, -14 (relative to p50)
    status: 'above' | 'on' | 'below';
    percentile: number | null; // estimated percentile
  } | null;
}

interface EmployeeBenchmarkResponse {
  employees: EmployeeBenchmarkData[];
  levelGroups: Record<string, EmployeeBenchmarkData[]>;
  summary: {
    totalEmployees: number;
    benchmarkedEmployees: number;
    averageMarketPosition: number;
  };
}

// Helper to map employee level enum to seniority level string for benchmark matching
function mapLevelToSeniority(level: string | null): string {
  if (!level) return 'Mid';

  const mapping: Record<string, string> = {
    'IC': 'Junior',
    'MANAGER': 'Manager',
    'DIRECTOR': 'Director',
    'VP': 'VP',
    'C_LEVEL': 'C-Level'
  };

  return mapping[level] || 'Mid';
}

// Helper to extract role family from role title (simplified)
function extractRoleFamily(role: string | null): string {
  if (!role) return 'Engineering';

  const roleLower = role.toLowerCase();

  if (roleLower.includes('engineer') || roleLower.includes('developer') || roleLower.includes('software')) {
    return 'Engineering';
  } else if (roleLower.includes('sales') || roleLower.includes('account executive')) {
    return 'Sales';
  } else if (roleLower.includes('marketing')) {
    return 'Marketing';
  } else if (roleLower.includes('product')) {
    return 'Product';
  } else if (roleLower.includes('design')) {
    return 'Design';
  } else if (roleLower.includes('finance') || roleLower.includes('accounting')) {
    return 'Finance';
  } else if (roleLower.includes('hr') || roleLower.includes('people')) {
    return 'People & Talent';
  } else if (roleLower.includes('operations') || roleLower.includes('ops')) {
    return 'Operations';
  }

  return 'Engineering'; // Default fallback
}

// Helper to calculate percentile estimate based on value relative to benchmark
function estimatePercentile(
  value: number,
  benchmark: { p10?: number; p25: number; p50: number; p75: number; p90?: number }
): number | null {
  if (!benchmark.p25 || !benchmark.p50 || !benchmark.p75) return null;

  // Simple linear interpolation between percentiles
  if (value <= benchmark.p25) {
    return 25;
  } else if (value <= benchmark.p50) {
    // Between p25 and p50
    const range = benchmark.p50 - benchmark.p25;
    const position = value - benchmark.p25;
    return 25 + (position / range) * 25;
  } else if (value <= benchmark.p75) {
    // Between p50 and p75
    const range = benchmark.p75 - benchmark.p50;
    const position = value - benchmark.p50;
    return 50 + (position / range) * 25;
  } else {
    return 75;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const datasetId = params.id;

  // Fetch the dataset with employees
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    select: {
      id: true,
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
        },
      },
      employees: {
        select: {
          id: true,
          employeeName: true,
          role: true,
          level: true,
          totalCompensation: true,
          annualSalary: true,
        },
      },
      _count: {
        select: {
          employees: true,
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
  const region = dataset.settings?.region || 'DACH';

  // Process each employee and find matching benchmarks
  const employeeBenchmarks: EmployeeBenchmarkData[] = [];
  let benchmarkedCount = 0;
  let totalMarketPositionSum = 0;

  for (const employee of dataset.employees) {
    const roleFamily = extractRoleFamily(employee.role);
    const seniorityLevel = mapLevelToSeniority(employee.level);

    // Try to find matching compensation benchmark
    // First try exact match, then broaden search
    let benchmark = await prisma.compensationBenchmark.findFirst({
      where: {
        roleFamily,
        seniorityLevel,
        industry,
        region,
        companySize,
      },
      select: {
        p25TotalComp: true,
        p50TotalComp: true,
        p75TotalComp: true,
        p10TotalComp: true,
        p90TotalComp: true,
        currency: true,
      },
    });

    // If no exact match, try without company size filter
    if (!benchmark) {
      benchmark = await prisma.compensationBenchmark.findFirst({
        where: {
          roleFamily,
          seniorityLevel,
          industry,
          region,
        },
        select: {
          p25TotalComp: true,
          p50TotalComp: true,
          p75TotalComp: true,
          p10TotalComp: true,
          p90TotalComp: true,
          currency: true,
        },
      });
    }

    // If still no match, try just role family and seniority
    if (!benchmark) {
      benchmark = await prisma.compensationBenchmark.findFirst({
        where: {
          roleFamily,
          seniorityLevel,
        },
        select: {
          p25TotalComp: true,
          p50TotalComp: true,
          p75TotalComp: true,
          p10TotalComp: true,
          p90TotalComp: true,
          currency: true,
        },
      });
    }

    let marketPosition = null;
    let benchmarkData = null;

    if (benchmark && benchmark.p50TotalComp) {
      const p25 = Number(benchmark.p25TotalComp) || Number(benchmark.p50TotalComp);
      const p50 = Number(benchmark.p50TotalComp);
      const p75 = Number(benchmark.p75TotalComp) || Number(benchmark.p50TotalComp);
      const p10 = benchmark.p10TotalComp ? Number(benchmark.p10TotalComp) : p25;
      const p90 = benchmark.p90TotalComp ? Number(benchmark.p90TotalComp) : p75;

      benchmarkData = {
        p25,
        p50,
        p75,
        currency: benchmark.currency,
      };

      const totalComp = Number(employee.totalCompensation);
      const percentDiff = ((totalComp - p50) / p50) * 100;

      let status: 'above' | 'on' | 'below';
      if (totalComp >= p50 * 1.05) {
        status = 'above'; // More than 5% above median
      } else if (totalComp <= p50 * 0.95) {
        status = 'below'; // More than 5% below median
      } else {
        status = 'on'; // Within 5% of median
      }

      const percentile = estimatePercentile(totalComp, { p10, p25, p50, p75, p90 });

      marketPosition = {
        percentDiff: Math.round(percentDiff),
        status,
        percentile,
      };

      benchmarkedCount++;
      totalMarketPositionSum += percentDiff;
    }

    employeeBenchmarks.push({
      id: employee.id,
      name: employee.employeeName || 'Anonymous Employee',
      role: employee.role || 'Unknown Role',
      level: employee.level || 'Not Set',
      totalCompensation: Number(employee.totalCompensation),
      benchmark: benchmarkData,
      marketPosition,
    });
  }

  // Group employees by level
  const levelGroups: Record<string, EmployeeBenchmarkData[]> = {};

  for (const emp of employeeBenchmarks) {
    const levelKey = emp.level;
    if (!levelGroups[levelKey]) {
      levelGroups[levelKey] = [];
    }
    levelGroups[levelKey].push(emp);
  }

  // Sort each level group by total compensation descending
  Object.keys(levelGroups).forEach(level => {
    levelGroups[level].sort((a, b) => b.totalCompensation - a.totalCompensation);
  });

  const response: EmployeeBenchmarkResponse = {
    employees: employeeBenchmarks,
    levelGroups,
    summary: {
      totalEmployees: dataset.employees.length,
      benchmarkedEmployees: benchmarkedCount,
      averageMarketPosition: benchmarkedCount > 0
        ? Math.round(totalMarketPositionSum / benchmarkedCount)
        : 0,
    },
  };

  return NextResponse.json(response);
}
