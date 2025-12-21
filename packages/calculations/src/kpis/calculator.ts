/**
 * KPI Calculator
 *
 * Calculates KPI values from employee and revenue data
 */

import { KPI_REGISTRY, type KPIDefinition } from './definitions';

/**
 * Employee data required for KPI calculations
 */
export interface EmployeeData {
  id: string;
  department: string;
  annualSalary: number;
  totalCompensation: number;
  employmentType: 'FTE' | 'CONTRACTOR' | 'PART_TIME' | 'INTERN';
  fteFactor: number;
  level?: 'IC' | 'MANAGER' | 'DIRECTOR' | 'VP' | 'C_LEVEL';
  location?: string;
  startDate?: Date;
  endDate?: Date | null;
}

/**
 * Dataset metadata for KPI calculations
 */
export interface DatasetMetadata {
  totalRevenue?: number;
  currency: string;
}

/**
 * Calculated KPI value with context
 */
export interface KPIValue {
  kpiId: string;
  value: number | null;
  formattedValue: string;
  status?: 'good' | 'warning' | 'bad'; // Compare to benchmark
  benchmarkComparison?: {
    low: number;
    median: number;
    high: number;
    percentile?: number;
  };
}

/**
 * Department mapping for standardization
 * Maps raw department names to KPI categories
 */
const DEPARTMENT_MAPPING: Record<string, string[]> = {
  customer_success: ['customer success', 'support', 'customer support', 'cs', 'customer service'],
  engineering: ['engineering', 'technology', 'dev', 'development', 'it', 'infrastructure', 'qa', 'quality assurance'],
  finance: ['finance', 'accounting', 'treasury', 'fp&a'],
  hr: ['hr', 'human resources', 'people', 'people ops', 'talent'],
  legal: ['legal', 'compliance', 'regulatory'],
  marketing: ['marketing', 'growth', 'brand', 'communications', 'pr', 'public relations'],
  operations: ['operations', 'ops', 'bizops', 'business operations'],
  product: ['product', 'product management', 'pm'],
  professional_services: ['professional services', 'consulting', 'implementation', 'services'],
  sales: ['sales', 'business development', 'bd', 'revenue', 'account management'],
};

/**
 * High-cost countries for location-based KPIs
 */
const HIGH_COST_COUNTRIES = [
  'united states', 'usa', 'us',
  'switzerland', 'norway', 'denmark', 'sweden',
  'united kingdom', 'uk', 'britain',
  'germany', 'france', 'netherlands', 'belgium',
  'australia', 'canada', 'singapore',
];

/**
 * Normalize department name to category
 */
function normalizeDepartment(department: string): string | null {
  const normalized = department.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(DEPARTMENT_MAPPING)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      return category;
    }
  }

  return null;
}

/**
 * Check if location is high-cost
 */
function isHighCostCountry(location?: string): boolean {
  if (!location) return false;
  const normalized = location.toLowerCase().trim();
  return HIGH_COST_COUNTRIES.some(country => normalized.includes(country));
}

/**
 * Format KPI value based on unit
 */
function formatKPIValue(value: number | null, definition: KPIDefinition): string {
  if (value === null) return 'N/A';

  switch (definition.unit) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return `$${(value / 1000000).toFixed(2)}M`;
    case 'ratio':
      return `${value.toFixed(2)}:1`;
    case 'years':
      return `${value.toFixed(1)} years`;
    case 'count':
      return Math.round(value).toString();
    default:
      return value.toFixed(2);
  }
}

/**
 * Determine status based on benchmark comparison
 */
function getKPIStatus(value: number, definition: KPIDefinition): 'good' | 'warning' | 'bad' | undefined {
  if (!definition.benchmarkRange) return undefined;

  const { low, median, high } = definition.benchmarkRange;

  // For percentages and ratios, generally lower is better for costs, higher is better for efficiency
  // This is a simplified heuristic - more sophisticated logic could be added per-KPI
  if (definition.id.includes('pct_revenue') || definition.id.includes('cost')) {
    // Lower is better for costs
    if (value <= median) return 'good';
    if (value <= high) return 'warning';
    return 'bad';
  } else {
    // Higher is better for efficiency/revenue
    if (value >= median) return 'good';
    if (value >= low) return 'warning';
    return 'bad';
  }
}

/**
 * Calculate all KPIs for a dataset
 */
export function calculateKPIs(
  employees: EmployeeData[],
  metadata: DatasetMetadata,
  kpiIds?: string[]
): KPIValue[] {
  // Filter to active employees only (no end date or end date in future)
  const activeEmployees = employees.filter(emp => !emp.endDate || emp.endDate > new Date());

  // Calculate totals
  const totalEmployees = activeEmployees.length;
  const totalFTEs = activeEmployees.reduce((sum, emp) => sum + emp.fteFactor, 0);
  const totalSalaries = activeEmployees.reduce((sum, emp) => sum + (emp.annualSalary || 0), 0);
  const totalCompensation = activeEmployees.reduce((sum, emp) => sum + (emp.totalCompensation || 0), 0);
  const totalRevenue = metadata.totalRevenue || 0;

  // Calculate manager count
  const managers = activeEmployees.filter(emp =>
    emp.level && ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'].includes(emp.level)
  );
  const ics = activeEmployees.filter(emp => emp.level === 'IC');

  // Group by department
  const byDepartment = activeEmployees.reduce((acc, emp) => {
    const category = normalizeDepartment(emp.department);
    if (!category) return acc;

    if (!acc[category]) {
      acc[category] = {
        count: 0,
        salaries: 0,
        compensation: 0,
      };
    }

    acc[category].count++;
    acc[category].salaries += emp.annualSalary || 0;
    acc[category].compensation += emp.totalCompensation || 0;

    return acc;
  }, {} as Record<string, { count: number; salaries: number; compensation: number }>);

  // Location analysis
  const inHighCostCountries = activeEmployees.filter(emp => isHighCostCountry(emp.location)).length;
  const inLowCostCountries = totalEmployees - inHighCostCountries;

  // Tenure calculation
  const employeesWithStartDate = activeEmployees.filter(emp => emp.startDate);
  const avgTenure = employeesWithStartDate.length > 0
    ? employeesWithStartDate.reduce((sum, emp) => {
        const years = (new Date().getTime() - emp.startDate!.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return sum + years;
      }, 0) / employeesWithStartDate.length
    : null;

  // Helper function to calculate department KPI
  const calcDeptKPI = (deptKey: string, metric: 'count' | 'salaries' | 'compensation'): number | null => {
    const dept = byDepartment[deptKey];
    if (!dept) return null;

    if (metric === 'count') return dept.count;
    if (metric === 'salaries') return dept.salaries;
    return dept.compensation;
  };

  // KPI calculation functions
  const calculators: Record<string, () => number | null> = {
    // Overall
    revenue_per_employee: () => totalRevenue && totalEmployees > 0 ? totalRevenue / totalEmployees : null,
    span_of_control: () => ics.length > 0 && managers.length > 0 ? ics.length / managers.length : null,
    salary_cost_pct_revenue: () => totalRevenue > 0 ? (totalSalaries / totalRevenue) * 100 : null,
    personnel_cost_pct_revenue: () => totalRevenue > 0 ? (totalCompensation / totalRevenue) * 100 : null,
    employees_high_cost_countries: () => totalEmployees > 0 ? (inHighCostCountries / totalEmployees) * 100 : null,
    employees_low_cost_countries: () => totalEmployees > 0 ? (inLowCostCountries / totalEmployees) * 100 : null,
    annual_headcount_change: () => null, // Requires historical data
    new_hires_pct: () => null, // Requires hire date tracking
    turnover_pct: () => null, // Requires departure tracking
    employee_tenure: () => avgTenure,

    // Customer Success
    css_employee_ratio: () => {
      const count = calcDeptKPI('customer_success', 'count');
      return count !== null && totalEmployees > 0 ? count / totalEmployees : null;
    },
    css_pct_employees: () => {
      const count = calcDeptKPI('customer_success', 'count');
      return count !== null && totalEmployees > 0 ? (count / totalEmployees) * 100 : null;
    },
    revenue_per_css: () => {
      const count = calcDeptKPI('customer_success', 'count');
      return count && count > 0 && totalRevenue ? totalRevenue / count : null;
    },
    css_salary_pct_revenue: () => {
      const salaries = calcDeptKPI('customer_success', 'salaries');
      return salaries !== null && totalRevenue > 0 ? (salaries / totalRevenue) * 100 : null;
    },
    css_personnel_pct_revenue: () => {
      const comp = calcDeptKPI('customer_success', 'compensation');
      return comp !== null && totalRevenue > 0 ? (comp / totalRevenue) * 100 : null;
    },

    // Engineering
    eng_employee_ratio: () => {
      const count = calcDeptKPI('engineering', 'count');
      return count !== null && totalEmployees > 0 ? count / totalEmployees : null;
    },
    eng_pct_employees: () => {
      const count = calcDeptKPI('engineering', 'count');
      return count !== null && totalEmployees > 0 ? (count / totalEmployees) * 100 : null;
    },
    revenue_per_eng: () => {
      const count = calcDeptKPI('engineering', 'count');
      return count && count > 0 && totalRevenue ? totalRevenue / count : null;
    },
    eng_salary_pct_revenue: () => {
      const salaries = calcDeptKPI('engineering', 'salaries');
      return salaries !== null && totalRevenue > 0 ? (salaries / totalRevenue) * 100 : null;
    },
    eng_personnel_pct_revenue: () => {
      const comp = calcDeptKPI('engineering', 'compensation');
      return comp !== null && totalRevenue > 0 ? (comp / totalRevenue) * 100 : null;
    },

    // Finance
    finance_employee_ratio: () => {
      const count = calcDeptKPI('finance', 'count');
      return count !== null && totalEmployees > 0 ? count / totalEmployees : null;
    },
    finance_pct_employees: () => {
      const count = calcDeptKPI('finance', 'count');
      return count !== null && totalEmployees > 0 ? (count / totalEmployees) * 100 : null;
    },
    revenue_per_finance: () => {
      const count = calcDeptKPI('finance', 'count');
      return count && count > 0 && totalRevenue ? totalRevenue / count : null;
    },
    finance_salary_pct_revenue: () => {
      const salaries = calcDeptKPI('finance', 'salaries');
      return salaries !== null && totalRevenue > 0 ? (salaries / totalRevenue) * 100 : null;
    },
    finance_personnel_pct_revenue: () => {
      const comp = calcDeptKPI('finance', 'compensation');
      return comp !== null && totalRevenue > 0 ? (comp / totalRevenue) * 100 : null;
    },

    // HR
    hr_employee_ratio: () => {
      const count = calcDeptKPI('hr', 'count');
      return count !== null && totalEmployees > 0 ? count / totalEmployees : null;
    },
    hr_pct_employees: () => {
      const count = calcDeptKPI('hr', 'count');
      return count !== null && totalEmployees > 0 ? (count / totalEmployees) * 100 : null;
    },
    revenue_per_hr: () => {
      const count = calcDeptKPI('hr', 'count');
      return count && count > 0 && totalRevenue ? totalRevenue / count : null;
    },
    hr_salary_pct_revenue: () => {
      const salaries = calcDeptKPI('hr', 'salaries');
      return salaries !== null && totalRevenue > 0 ? (salaries / totalRevenue) * 100 : null;
    },
    hr_personnel_pct_revenue: () => {
      const comp = calcDeptKPI('hr', 'compensation');
      return comp !== null && totalRevenue > 0 ? (comp / totalRevenue) * 100 : null;
    },

    // Legal
    legal_employee_ratio: () => {
      const count = calcDeptKPI('legal', 'count');
      return count !== null && totalEmployees > 0 ? count / totalEmployees : null;
    },
    legal_pct_employees: () => {
      const count = calcDeptKPI('legal', 'count');
      return count !== null && totalEmployees > 0 ? (count / totalEmployees) * 100 : null;
    },
    revenue_per_legal: () => {
      const count = calcDeptKPI('legal', 'count');
      return count && count > 0 && totalRevenue ? totalRevenue / count : null;
    },
    legal_salary_pct_revenue: () => {
      const salaries = calcDeptKPI('legal', 'salaries');
      return salaries !== null && totalRevenue > 0 ? (salaries / totalRevenue) * 100 : null;
    },
    legal_personnel_pct_revenue: () => {
      const comp = calcDeptKPI('legal', 'compensation');
      return comp !== null && totalRevenue > 0 ? (comp / totalRevenue) * 100 : null;
    },

    // Marketing
    marketing_employee_ratio: () => {
      const count = calcDeptKPI('marketing', 'count');
      return count !== null && totalEmployees > 0 ? count / totalEmployees : null;
    },
    marketing_pct_employees: () => {
      const count = calcDeptKPI('marketing', 'count');
      return count !== null && totalEmployees > 0 ? (count / totalEmployees) * 100 : null;
    },
    revenue_per_marketing: () => {
      const count = calcDeptKPI('marketing', 'count');
      return count && count > 0 && totalRevenue ? totalRevenue / count : null;
    },
    marketing_salary_pct_revenue: () => {
      const salaries = calcDeptKPI('marketing', 'salaries');
      return salaries !== null && totalRevenue > 0 ? (salaries / totalRevenue) * 100 : null;
    },
    marketing_personnel_pct_revenue: () => {
      const comp = calcDeptKPI('marketing', 'compensation');
      return comp !== null && totalRevenue > 0 ? (comp / totalRevenue) * 100 : null;
    },

    // Operations
    ops_employee_ratio: () => {
      const count = calcDeptKPI('operations', 'count');
      return count !== null && totalEmployees > 0 ? count / totalEmployees : null;
    },
    ops_pct_employees: () => {
      const count = calcDeptKPI('operations', 'count');
      return count !== null && totalEmployees > 0 ? (count / totalEmployees) * 100 : null;
    },
    revenue_per_ops: () => {
      const count = calcDeptKPI('operations', 'count');
      return count && count > 0 && totalRevenue ? totalRevenue / count : null;
    },
    ops_salary_pct_revenue: () => {
      const salaries = calcDeptKPI('operations', 'salaries');
      return salaries !== null && totalRevenue > 0 ? (salaries / totalRevenue) * 100 : null;
    },
    ops_personnel_pct_revenue: () => {
      const comp = calcDeptKPI('operations', 'compensation');
      return comp !== null && totalRevenue > 0 ? (comp / totalRevenue) * 100 : null;
    },

    // Product
    product_employee_ratio: () => {
      const count = calcDeptKPI('product', 'count');
      return count !== null && totalEmployees > 0 ? count / totalEmployees : null;
    },
    product_pct_employees: () => {
      const count = calcDeptKPI('product', 'count');
      return count !== null && totalEmployees > 0 ? (count / totalEmployees) * 100 : null;
    },
    revenue_per_product: () => {
      const count = calcDeptKPI('product', 'count');
      return count && count > 0 && totalRevenue ? totalRevenue / count : null;
    },
    product_salary_pct_revenue: () => {
      const salaries = calcDeptKPI('product', 'salaries');
      return salaries !== null && totalRevenue > 0 ? (salaries / totalRevenue) * 100 : null;
    },
    product_personnel_pct_revenue: () => {
      const comp = calcDeptKPI('product', 'compensation');
      return comp !== null && totalRevenue > 0 ? (comp / totalRevenue) * 100 : null;
    },

    // Professional Services
    ps_employee_ratio: () => {
      const count = calcDeptKPI('professional_services', 'count');
      return count !== null && totalEmployees > 0 ? count / totalEmployees : null;
    },
    ps_pct_employees: () => {
      const count = calcDeptKPI('professional_services', 'count');
      return count !== null && totalEmployees > 0 ? (count / totalEmployees) * 100 : null;
    },
    revenue_per_ps: () => {
      const count = calcDeptKPI('professional_services', 'count');
      return count && count > 0 && totalRevenue ? totalRevenue / count : null;
    },
    ps_salary_pct_revenue: () => {
      const salaries = calcDeptKPI('professional_services', 'salaries');
      return salaries !== null && totalRevenue > 0 ? (salaries / totalRevenue) * 100 : null;
    },
    ps_personnel_pct_revenue: () => {
      const comp = calcDeptKPI('professional_services', 'compensation');
      return comp !== null && totalRevenue > 0 ? (comp / totalRevenue) * 100 : null;
    },

    // Sales
    sales_employee_ratio: () => {
      const count = calcDeptKPI('sales', 'count');
      return count !== null && totalEmployees > 0 ? count / totalEmployees : null;
    },
    sales_pct_employees: () => {
      const count = calcDeptKPI('sales', 'count');
      return count !== null && totalEmployees > 0 ? (count / totalEmployees) * 100 : null;
    },
    revenue_per_sales: () => {
      const count = calcDeptKPI('sales', 'count');
      return count && count > 0 && totalRevenue ? totalRevenue / count : null;
    },
    sales_salary_pct_revenue: () => {
      const salaries = calcDeptKPI('sales', 'salaries');
      return salaries !== null && totalRevenue > 0 ? (salaries / totalRevenue) * 100 : null;
    },
    sales_personnel_pct_revenue: () => {
      const comp = calcDeptKPI('sales', 'compensation');
      return comp !== null && totalRevenue > 0 ? (comp / totalRevenue) * 100 : null;
    },
  };

  // Calculate requested KPIs (or all if not specified)
  const kpisToCalculate = kpiIds || Object.keys(KPI_REGISTRY);

  return kpisToCalculate.map(kpiId => {
    const definition = KPI_REGISTRY[kpiId];
    if (!definition) {
      return {
        kpiId,
        value: null,
        formattedValue: 'Unknown KPI',
      };
    }

    const calculator = calculators[kpiId];
    const value = calculator ? calculator() : null;

    return {
      kpiId,
      value,
      formattedValue: formatKPIValue(value, definition),
      status: value !== null ? getKPIStatus(value, definition) : undefined,
      benchmarkComparison: definition.benchmarkRange,
    };
  });
}
