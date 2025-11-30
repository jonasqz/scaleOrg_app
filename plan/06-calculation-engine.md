# Calculation Engine Specification

## Overview

The calculation engine is the core of scleorg's value proposition. It must be:
- **Accurate**: Calculations must match industry-standard formulas
- **Fast**: Results in <2 seconds for datasets up to 1,000 employees
- **Testable**: 100% unit test coverage for all calculations
- **Extensible**: Easy to add new metrics
- **Deterministic**: Same input always produces same output

---

## Architecture

### Module Structure

```
packages/calculations/
├── src/
│   ├── core/
│   │   ├── cost.ts           # Cost calculations
│   │   ├── structure.ts      # Structural metrics
│   │   ├── productivity.ts   # Productivity metrics
│   │   └── outliers.ts       # Outlier detection
│   ├── benchmarks/
│   │   ├── compare.ts        # Benchmark comparison
│   │   └── data.ts           # Benchmark data access
│   ├── scenarios/
│   │   ├── transform.ts      # Scenario transformations
│   │   └── types.ts          # Scenario type implementations
│   ├── utils/
│   │   ├── aggregations.ts   # Common aggregation functions
│   │   ├── statistics.ts     # Statistical functions
│   │   └── normalizations.ts # Data normalization
│   └── index.ts              # Main calculation orchestrator
└── tests/
    ├── cost.test.ts
    ├── structure.test.ts
    └── scenarios.test.ts
```

---

## Data Types

### Input Types

```typescript
interface Employee {
  id: string;
  dataset_id: string;
  department: string;
  role?: string;
  level?: EmployeeLevel;
  manager_id?: string;
  employment_type: EmploymentType;
  fte_factor: number;
  annual_salary: number;
  bonus?: number;
  equity_value?: number;
  total_compensation: number;
  start_date?: Date;
  end_date?: Date;
}

type EmployeeLevel = 'IC' | 'Manager' | 'Director' | 'VP' | 'C-Level';
type EmploymentType = 'FTE' | 'Contractor' | 'Part-time' | 'Intern';

interface Dataset {
  id: string;
  total_revenue?: number;
  fiscal_year_start?: Date;
  currency: string;
}

interface OpenRole {
  id: string;
  dataset_id: string;
  department: string;
  role_name: string;
  planned_total_comp: number;
  planned_start_date?: Date;
}
```

### Output Types

```typescript
interface CalculationResult {
  dataset_id: string;
  calculated_at: Date;
  summary: SummaryMetrics;
  departments: DepartmentBreakdown;
  ratios: RatioMetrics;
  outliers: OutlierAnalysis;
}

interface SummaryMetrics {
  total_fte: number;
  total_cost: number;
  cost_per_fte: number;
  revenue_per_fte?: number;
  employee_count: number;
}

interface DepartmentBreakdown {
  [department: string]: {
    fte: number;
    cost: number;
    avg_compensation: number;
    percentage: number;
    employee_count: number;
  };
}

interface RatioMetrics {
  rd_gtm: number;
  manager_ic: number;
  avg_span_of_control: number;
}

interface OutlierAnalysis {
  high_cost_employees: OutlierEmployee[];
  low_span_managers: OutlierManager[];
  department_imbalances: DepartmentImbalance[];
}
```

---

## Core Calculations

### 1. Cost Calculations

#### Total Personnel Cost

```typescript
function calculateTotalCost(employees: Employee[]): number {
  return employees.reduce((sum, emp) => {
    // Only count active employees (no end_date or end_date in future)
    if (emp.end_date && emp.end_date < new Date()) {
      return sum;
    }
    return sum + emp.total_compensation;
  }, 0);
}
```

**Formula:**
```
Total Cost = Σ(total_compensation) for all active employees
```

---

#### Cost per FTE

```typescript
function calculateCostPerFTE(
  totalCost: number,
  totalFTE: number
): number {
  if (totalFTE === 0) return 0;
  return totalCost / totalFTE;
}
```

**Formula:**
```
Cost per FTE = Total Personnel Cost / Total FTE
```

---

#### Total FTE

```typescript
function calculateTotalFTE(employees: Employee[]): number {
  return employees.reduce((sum, emp) => {
    if (emp.end_date && emp.end_date < new Date()) {
      return sum;
    }
    return sum + emp.fte_factor;
  }, 0);
}
```

**Formula:**
```
Total FTE = Σ(fte_factor) for all active employees
```

---

#### Department Cost Breakdown

```typescript
function calculateDepartmentBreakdown(
  employees: Employee[]
): DepartmentBreakdown {
  const deptMap = new Map<string, Employee[]>();

  // Group by department
  employees.forEach(emp => {
    if (emp.end_date && emp.end_date < new Date()) return;

    const dept = normalizeDepartment(emp.department);
    if (!deptMap.has(dept)) {
      deptMap.set(dept, []);
    }
    deptMap.get(dept)!.push(emp);
  });

  const totalCost = calculateTotalCost(employees);
  const breakdown: DepartmentBreakdown = {};

  deptMap.forEach((deptEmployees, dept) => {
    const cost = deptEmployees.reduce(
      (sum, emp) => sum + emp.total_compensation,
      0
    );
    const fte = deptEmployees.reduce(
      (sum, emp) => sum + emp.fte_factor,
      0
    );

    breakdown[dept] = {
      fte,
      cost,
      avg_compensation: cost / fte,
      percentage: (cost / totalCost) * 100,
      employee_count: deptEmployees.length
    };
  });

  return breakdown;
}
```

---

### 2. Structural Metrics

#### R&D:GTM Ratio

```typescript
function calculateRDtoGTMRatio(
  breakdown: DepartmentBreakdown
): number {
  const rdFTE = breakdown['R&D']?.fte || 0;
  const gtmFTE = breakdown['GTM']?.fte || 0;

  if (gtmFTE === 0) return Infinity;
  return rdFTE / gtmFTE;
}
```

**Formula:**
```
R&D:GTM = R&D FTE / GTM FTE
```

**Department Classification:**
- **R&D**: Engineering, Product, Design, Data, QA
- **GTM**: Sales, Marketing, Customer Success, Partnerships, SDR
- **G&A**: Finance, HR, Legal, IT, Admin, Recruiting
- **Operations**: Logistics, Manufacturing, Supply Chain, Facilities

---

#### Manager:IC Ratio

```typescript
function calculateManagerToICRatio(
  employees: Employee[]
): number {
  const managers = employees.filter(emp =>
    emp.level && ['Manager', 'Director', 'VP', 'C-Level'].includes(emp.level)
  );
  const ics = employees.filter(emp =>
    !emp.level || emp.level === 'IC'
  );

  if (ics.length === 0) return Infinity;
  return managers.length / ics.length;
}
```

**Formula:**
```
Manager:IC = Count(Managers) / Count(ICs)
```

---

#### Average Span of Control

```typescript
function calculateAvgSpanOfControl(
  employees: Employee[]
): number {
  const managerCounts = new Map<string, number>();

  employees.forEach(emp => {
    if (emp.manager_id) {
      const count = managerCounts.get(emp.manager_id) || 0;
      managerCounts.set(emp.manager_id, count + 1);
    }
  });

  if (managerCounts.size === 0) return 0;

  const totalReports = Array.from(managerCounts.values())
    .reduce((sum, count) => sum + count, 0);

  return totalReports / managerCounts.size;
}
```

**Formula:**
```
Avg Span of Control = Total Direct Reports / Number of Managers
```

---

### 3. Productivity Metrics

#### Revenue per FTE

```typescript
function calculateRevenuePerFTE(
  totalRevenue: number,
  totalFTE: number
): number | null {
  if (!totalRevenue || totalFTE === 0) return null;
  return totalRevenue / totalFTE;
}
```

**Formula:**
```
Revenue per FTE = Total Annual Revenue / Total FTE
```

---

#### Engineers per PM

```typescript
function calculateEngineersPerPM(
  employees: Employee[]
): number {
  const engineers = employees.filter(emp =>
    emp.department === 'Engineering' ||
    emp.role?.toLowerCase().includes('engineer')
  );

  const pms = employees.filter(emp =>
    emp.department === 'Product' ||
    emp.role?.toLowerCase().includes('product manager')
  );

  if (pms.length === 0) return Infinity;
  return engineers.length / pms.length;
}
```

**Formula:**
```
Engineers per PM = Count(Engineers) / Count(Product Managers)
```

---

### 4. Outlier Detection

#### High Cost Employees (Z-Score Method)

```typescript
function detectHighCostOutliers(
  employees: Employee[],
  threshold: number = 2.5
): OutlierEmployee[] {
  const compensations = employees.map(e => e.total_compensation);
  const mean = average(compensations);
  const stdDev = standardDeviation(compensations);

  return employees
    .map(emp => ({
      employee: emp,
      z_score: (emp.total_compensation - mean) / stdDev
    }))
    .filter(item => item.z_score > threshold)
    .map(item => ({
      employee_id: item.employee.id,
      department: item.employee.department,
      role: item.employee.role,
      total_compensation: item.employee.total_compensation,
      z_score: item.z_score,
      delta_from_mean: item.employee.total_compensation - mean
    }))
    .sort((a, b) => b.z_score - a.z_score);
}
```

**Formula:**
```
Z-Score = (Value - Mean) / Standard Deviation
Outlier if Z-Score > 2.5
```

---

#### Low Span Managers

```typescript
function detectLowSpanManagers(
  employees: Employee[],
  minSpan: number = 3
): OutlierManager[] {
  const managerReports = new Map<string, Employee[]>();

  employees.forEach(emp => {
    if (emp.manager_id) {
      if (!managerReports.has(emp.manager_id)) {
        managerReports.set(emp.manager_id, []);
      }
      managerReports.get(emp.manager_id)!.push(emp);
    }
  });

  const outliers: OutlierManager[] = [];

  managerReports.forEach((reports, managerId) => {
    if (reports.length < minSpan) {
      const manager = employees.find(e => e.id === managerId);
      if (manager) {
        outliers.push({
          manager_id: managerId,
          manager_name: manager.employee_name,
          department: manager.department,
          direct_reports_count: reports.length,
          expected_min: minSpan
        });
      }
    }
  });

  return outliers;
}
```

---

## Benchmark Comparison

### Comparison Logic

```typescript
interface BenchmarkMetric {
  min?: number;
  p25?: number;
  median: number;
  p75?: number;
  max?: number;
}

interface ComparisonResult {
  value: number;
  benchmark: BenchmarkMetric;
  percentile: number;
  status: 'below' | 'within' | 'above';
  delta_pct: number;
  severity: 'low' | 'medium' | 'high';
}

function compareToBenchmark(
  value: number,
  benchmark: BenchmarkMetric
): ComparisonResult {
  // Calculate percentile (simplified)
  let percentile: number;
  if (value <= benchmark.p25!) percentile = 25;
  else if (value <= benchmark.median) percentile = 50;
  else if (value <= benchmark.p75!) percentile = 75;
  else percentile = 90;

  // Determine status
  let status: ComparisonResult['status'];
  if (value < benchmark.p25!) status = 'below';
  else if (value > benchmark.p75!) status = 'above';
  else status = 'within';

  // Calculate delta
  const delta_pct = ((value - benchmark.median) / benchmark.median) * 100;

  // Determine severity
  let severity: ComparisonResult['severity'];
  if (Math.abs(delta_pct) < 15) severity = 'low';
  else if (Math.abs(delta_pct) < 30) severity = 'medium';
  else severity = 'high';

  return {
    value,
    benchmark,
    percentile,
    status,
    delta_pct,
    severity
  };
}
```

---

## Scenario Transformations

### Transformation Types

```typescript
type ScenarioOperation =
  | { action: 'remove'; filter: EmployeeFilter }
  | { action: 'add'; department: string; count: number; avg_salary: number }
  | { action: 'modify'; filter: EmployeeFilter; changes: Partial<Employee> };

interface EmployeeFilter {
  department?: string;
  employment_type?: EmploymentType;
  role?: string;
  custom?: (emp: Employee) => boolean;
}
```

### Scenario: Hiring Freeze

```typescript
function applyHiringFreeze(
  employees: Employee[],
  openRoles: OpenRole[]
): { employees: Employee[]; openRoles: OpenRole[] } {
  return {
    employees,
    openRoles: []  // Remove all open roles
  };
}
```

---

### Scenario: Cost Reduction

```typescript
function applyCostReduction(
  employees: Employee[],
  reductionPct: number,
  targetDepartments?: string[]
): Employee[] {
  const totalCost = calculateTotalCost(employees);
  const targetReduction = totalCost * (reductionPct / 100);

  // Filter to target departments or all
  let candidateEmployees = targetDepartments
    ? employees.filter(e => targetDepartments.includes(normalizeDepartment(e.department)))
    : employees;

  // Sort by cost (highest first)
  candidateEmployees.sort((a, b) => b.total_compensation - a.total_compensation);

  let removedCost = 0;
  const removedIds = new Set<string>();

  for (const emp of candidateEmployees) {
    if (removedCost >= targetReduction) break;
    removedIds.add(emp.id);
    removedCost += emp.total_compensation;
  }

  return employees.filter(emp => !removedIds.has(emp.id));
}
```

---

### Scenario: Growth

```typescript
function applyGrowth(
  employees: Employee[],
  additionalFTE: number,
  distribution: { [dept: string]: number }  // Percentages
): Employee[] {
  const newEmployees: Employee[] = [];

  Object.entries(distribution).forEach(([dept, pct]) => {
    const deptFTE = Math.round(additionalFTE * pct);
    const avgSalary = calculateDepartmentAvgSalary(employees, dept);

    for (let i = 0; i < deptFTE; i++) {
      newEmployees.push({
        id: `new_${dept}_${i}`,
        dataset_id: employees[0]?.dataset_id || '',
        department: dept,
        employment_type: 'FTE',
        fte_factor: 1.0,
        annual_salary: avgSalary,
        total_compensation: avgSalary,
        // ... other fields
      });
    }
  });

  return [...employees, ...newEmployees];
}
```

---

### Scenario: Target Ratio

```typescript
function applyTargetRatio(
  employees: Employee[],
  targetRatio: number  // e.g., 1.0 for R&D:GTM
): Employee[] {
  const breakdown = calculateDepartmentBreakdown(employees);
  const currentRDFTE = breakdown['R&D']?.fte || 0;
  const currentGTMFTE = breakdown['GTM']?.fte || 0;
  const currentRatio = currentRDFTE / currentGTMFTE;

  if (currentRatio > targetRatio) {
    // Too much R&D, add GTM
    const neededGTMFTE = currentRDFTE / targetRatio - currentGTMFTE;
    return applyGrowth(employees, neededGTMFTE, { 'GTM': 1.0 });
  } else {
    // Too much GTM, add R&D
    const neededRDFTE = currentGTMFTE * targetRatio - currentRDFTE;
    return applyGrowth(employees, neededRDFTE, { 'R&D': 1.0 });
  }
}
```

---

## Utility Functions

### Statistical Functions

```typescript
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function standardDeviation(values: number[]): number {
  const avg = average(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquareDiff = average(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
```

---

### Normalization Functions

```typescript
function normalizeDepartment(dept: string): string {
  const lower = dept.toLowerCase();

  if (/(eng|product|design|data|qa|r&d)/i.test(lower)) return 'R&D';
  if (/(sales|market|customer|cs|gtm|sdr|partnership)/i.test(lower)) return 'GTM';
  if (/(finance|hr|legal|it|admin|recruit)/i.test(lower)) return 'G&A';
  if (/(ops|logistic|supply|manufactur)/i.test(lower)) return 'Operations';

  return 'Other';
}

function inferEmployeeLevel(role?: string, managerId?: string): EmployeeLevel {
  if (!role) return managerId ? 'IC' : 'Manager';

  const lower = role.toLowerCase();

  if (/\b(ceo|cfo|cto|coo|cpo|chief)\b/i.test(lower)) return 'C-Level';
  if (/\bvp\b|\bvice president\b/i.test(lower)) return 'VP';
  if (/\bdirector\b/i.test(lower)) return 'Director';
  if (/\bmanager\b|\blead\b|\bhead of\b/i.test(lower)) return 'Manager';

  return 'IC';
}
```

---

## Testing Strategy

### Unit Tests

**Coverage Target:** 100% for calculation functions

```typescript
describe('Cost Calculations', () => {
  test('calculates total cost correctly', () => {
    const employees = [
      { total_compensation: 100000, end_date: null },
      { total_compensation: 120000, end_date: null },
      { total_compensation: 80000, end_date: new Date('2024-01-01') }  // Past
    ];
    expect(calculateTotalCost(employees)).toBe(220000);
  });

  test('handles empty employee array', () => {
    expect(calculateTotalCost([])).toBe(0);
  });

  test('handles division by zero in cost per FTE', () => {
    expect(calculateCostPerFTE(100000, 0)).toBe(0);
  });
});
```

### Integration Tests

```typescript
describe('Full Calculation Pipeline', () => {
  test('calculates all metrics for sample dataset', () => {
    const employees = generateSampleEmployees(100);
    const result = calculateAllMetrics(employees, dataset);

    expect(result.summary.total_fte).toBeGreaterThan(0);
    expect(result.departments).toHaveProperty('R&D');
    expect(result.ratios.rd_gtm).toBeCloseTo(1.2, 1);
  });
});
```

### Performance Tests

```typescript
describe('Performance', () => {
  test('calculates metrics for 1000 employees in <1s', () => {
    const employees = generateSampleEmployees(1000);
    const start = Date.now();
    calculateAllMetrics(employees, dataset);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});
```

---

## Caching Strategy

### Cache Keys

```typescript
function getCacheKey(datasetId: string, type: string): string {
  return `metrics:${datasetId}:${type}`;
}
```

### Cache Invalidation

Invalidate when:
- Dataset is updated
- Employees are added/removed
- Benchmarks are updated
- Scenario is modified

**TTL:** 1 hour for metrics, 24 hours for benchmarks

---

**Calculation Engine Version:** 1.0
**Last Updated:** 2025-11-29
**Test Coverage Target:** 100%
**Performance Target:** <2s for 1,000 employees
