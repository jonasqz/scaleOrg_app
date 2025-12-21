/**
 * Calculate target compensation (SHOULD) from benchmark data
 */

interface Employee {
  id: string;
  employeeName: string | null;
  role: string | null;
  level: string | null;
  department: string;
  location: string | null;
  totalCompensation: number;
}

interface CompensationBenchmark {
  id: string;
  roleFamily: string;
  standardizedTitle: string;
  seniorityLevel: string;
  industry: string;
  region: string;
  companySize: string;
  p10TotalComp: number | null;
  p25TotalComp: number | null;
  p50TotalComp: number | null;
  p75TotalComp: number | null;
  p90TotalComp: number | null;
  sampleSize: number;
  currency: string;
}

interface DatasetSettings {
  industry?: string;
  region?: string;
}

interface TargetCalculationResult {
  employeeId: string;
  targetAnnualComp: number;
  calculationMethod: string;
  benchmarkSource: string | null;
  explanation: {
    benchmarkUsed: {
      roleFamily: string;
      standardizedTitle: string;
      seniorityLevel: string;
      industry: string;
      region: string;
      companySize: string;
      sampleSize: number;
    } | null;
    selectedPercentile: string;
    benchmarkValue: number;
    currentCompensation: number;
    gap: number;
    gapPercent: number;
    locationAdjustment?: number;
    performanceAdjustment?: number;
  };
}

/**
 * Simple role mapping to benchmark taxonomy
 * In production, this would use the RoleTitleLibrary and fuzzy matching
 */
function mapRoleToBenchmark(
  role: string | null,
  level: string | null
): { roleFamily: string; standardizedTitle: string; seniorityLevel: string } | null {
  if (!role) return null;

  const roleLower = role.toLowerCase();

  // Engineering roles
  if (
    roleLower.includes('engineer') ||
    roleLower.includes('developer') ||
    roleLower.includes('programmer')
  ) {
    const title = 'Software Engineer';
    let seniority = 'Mid';

    if (roleLower.includes('senior') || roleLower.includes('sr.')) {
      seniority = 'Senior';
    } else if (
      roleLower.includes('junior') ||
      roleLower.includes('jr.') ||
      roleLower.includes('associate')
    ) {
      seniority = 'Junior';
    } else if (
      roleLower.includes('lead') ||
      roleLower.includes('principal') ||
      roleLower.includes('staff')
    ) {
      seniority = 'Lead';
    }

    // Use employee level if available
    if (level) {
      const levelLower = level.toLowerCase();
      if (levelLower === 'manager') seniority = 'Manager';
      else if (levelLower === 'director') seniority = 'Director';
      else if (levelLower === 'vp' || levelLower === 'c_level') seniority = 'Director';
    }

    return { roleFamily: 'Engineering', standardizedTitle: title, seniorityLevel: seniority };
  }

  // Product roles
  if (roleLower.includes('product')) {
    const title = 'Product Manager';
    let seniority = 'Mid';

    if (roleLower.includes('senior') || roleLower.includes('sr.')) {
      seniority = 'Senior';
    } else if (roleLower.includes('junior') || roleLower.includes('jr.')) {
      seniority = 'Junior';
    } else if (
      roleLower.includes('lead') ||
      roleLower.includes('principal') ||
      roleLower.includes('chief')
    ) {
      seniority = 'Lead';
    }

    if (level) {
      const levelLower = level.toLowerCase();
      if (levelLower === 'director') seniority = 'Director';
      else if (levelLower === 'vp' || levelLower === 'c_level') seniority = 'Director';
    }

    return { roleFamily: 'Product', standardizedTitle: title, seniorityLevel: seniority };
  }

  // Sales roles
  if (
    roleLower.includes('sales') ||
    roleLower.includes('account executive') ||
    roleLower.includes('ae')
  ) {
    const title = 'Account Executive';
    let seniority = 'Mid';

    if (roleLower.includes('senior') || roleLower.includes('sr.')) {
      seniority = 'Senior';
    } else if (roleLower.includes('junior') || roleLower.includes('jr.')) {
      seniority = 'Junior';
    }

    if (level) {
      const levelLower = level.toLowerCase();
      if (levelLower === 'manager') seniority = 'Manager';
      else if (levelLower === 'director') seniority = 'Director';
      else if (levelLower === 'vp') seniority = 'VP';
    }

    return { roleFamily: 'Sales', standardizedTitle: title, seniorityLevel: seniority };
  }

  // Marketing roles
  if (roleLower.includes('marketing')) {
    const title = 'Marketing Manager';
    let seniority = 'Mid';

    if (roleLower.includes('senior') || roleLower.includes('sr.')) {
      seniority = 'Senior';
    } else if (roleLower.includes('junior') || roleLower.includes('jr.')) {
      seniority = 'Junior';
    }

    if (level) {
      const levelLower = level.toLowerCase();
      if (levelLower === 'director') seniority = 'Director';
      else if (levelLower === 'vp' || levelLower === 'c_level') seniority = 'VP';
    }

    return { roleFamily: 'Marketing', standardizedTitle: title, seniorityLevel: seniority };
  }

  // Design roles
  if (roleLower.includes('design')) {
    const title = 'Designer';
    let seniority = 'Mid';

    if (roleLower.includes('senior') || roleLower.includes('sr.')) {
      seniority = 'Senior';
    } else if (roleLower.includes('junior') || roleLower.includes('jr.')) {
      seniority = 'Junior';
    } else if (roleLower.includes('lead') || roleLower.includes('principal')) {
      seniority = 'Lead';
    }

    return { roleFamily: 'Design', standardizedTitle: title, seniorityLevel: seniority };
  }

  // Default fallback
  return null;
}

/**
 * Find matching benchmark for an employee
 */
function findMatchingBenchmark(
  employee: Employee,
  benchmarks: CompensationBenchmark[],
  settings: DatasetSettings | null,
  companySize: string
): CompensationBenchmark | null {
  // Map employee role to benchmark taxonomy
  const roleMapping = mapRoleToBenchmark(employee.role, employee.level);
  if (!roleMapping) {
    return null;
  }

  // Filter benchmarks by role
  let matches = benchmarks.filter(
    b =>
      b.roleFamily === roleMapping.roleFamily &&
      b.standardizedTitle === roleMapping.standardizedTitle &&
      b.seniorityLevel === roleMapping.seniorityLevel
  );

  if (matches.length === 0) {
    // Try without seniority level
    matches = benchmarks.filter(
      b =>
        b.roleFamily === roleMapping.roleFamily &&
        b.standardizedTitle === roleMapping.standardizedTitle
    );
  }

  if (matches.length === 0) {
    return null;
  }

  // Filter by dataset settings if available
  if (settings?.industry) {
    const industryMatches = matches.filter(b => b.industry === settings.industry);
    if (industryMatches.length > 0) {
      matches = industryMatches;
    }
  }

  if (settings?.region) {
    const regionMatches = matches.filter(b => b.region === settings.region);
    if (regionMatches.length > 0) {
      matches = regionMatches;
    }
  }

  // Filter by company size
  const sizeMatches = matches.filter(b => b.companySize === companySize);
  if (sizeMatches.length > 0) {
    matches = sizeMatches;
  }

  // Return the best match (prefer higher sample size)
  matches.sort((a, b) => b.sampleSize - a.sampleSize);
  return matches[0];
}

/**
 * Calculate target compensation for employees based on benchmarks
 *
 * @param employees - List of employees to calculate targets for
 * @param benchmarks - Available compensation benchmarks
 * @param settings - Dataset settings (industry, region, etc.)
 * @param companySize - Company size category (e.g., "51-200", "201-500")
 * @param targetPercentile - Which percentile to target (default: "p50" for median)
 * @returns Array of target calculations for each employee
 */
export function calculateTargetCompensation(
  employees: Employee[],
  benchmarks: CompensationBenchmark[],
  settings: DatasetSettings | null,
  companySize: string,
  targetPercentile: 'p10' | 'p25' | 'p50' | 'p75' | 'p90' = 'p50'
): TargetCalculationResult[] {
  const results: TargetCalculationResult[] = [];

  for (const employee of employees) {
    // Find matching benchmark
    const benchmark = findMatchingBenchmark(employee, benchmarks, settings, companySize);

    if (!benchmark) {
      // No benchmark found - use current compensation as target
      results.push({
        employeeId: employee.id,
        targetAnnualComp: employee.totalCompensation,
        calculationMethod: 'current',
        benchmarkSource: null,
        explanation: {
          benchmarkUsed: null,
          selectedPercentile: 'N/A',
          benchmarkValue: employee.totalCompensation,
          currentCompensation: employee.totalCompensation,
          gap: 0,
          gapPercent: 0,
        },
      });
      continue;
    }

    // Get benchmark value for selected percentile
    const benchmarkValue =
      benchmark[`${targetPercentile}TotalComp`] || benchmark.p50TotalComp || 0;

    if (!benchmarkValue) {
      // No data for this percentile
      results.push({
        employeeId: employee.id,
        targetAnnualComp: employee.totalCompensation,
        calculationMethod: 'current',
        benchmarkSource: null,
        explanation: {
          benchmarkUsed: null,
          selectedPercentile: 'N/A',
          benchmarkValue: employee.totalCompensation,
          currentCompensation: employee.totalCompensation,
          gap: 0,
          gapPercent: 0,
        },
      });
      continue;
    }

    // Calculate target (could apply adjustments here)
    const targetComp = benchmarkValue;
    const gap = targetComp - employee.totalCompensation;
    const gapPercent =
      employee.totalCompensation > 0 ? (gap / employee.totalCompensation) * 100 : 0;

    results.push({
      employeeId: employee.id,
      targetAnnualComp: targetComp,
      calculationMethod: 'benchmark',
      benchmarkSource: `${benchmark.industry} - ${benchmark.region} - ${benchmark.companySize}`,
      explanation: {
        benchmarkUsed: {
          roleFamily: benchmark.roleFamily,
          standardizedTitle: benchmark.standardizedTitle,
          seniorityLevel: benchmark.seniorityLevel,
          industry: benchmark.industry,
          region: benchmark.region,
          companySize: benchmark.companySize,
          sampleSize: benchmark.sampleSize,
        },
        selectedPercentile: targetPercentile,
        benchmarkValue: benchmarkValue,
        currentCompensation: employee.totalCompensation,
        gap: gap,
        gapPercent: gapPercent,
      },
    });
  }

  return results;
}
