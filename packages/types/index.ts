// Shared types for scleorg

export interface CalculationResult {
  datasetId: string;
  calculatedAt: Date;
  summary: SummaryMetrics;
  departments: DepartmentBreakdown;
  ratios: RatioMetrics;
  outliers: OutlierAnalysis;
}

export interface SummaryMetrics {
  totalFTE: number;
  totalCost: number;
  costPerFTE: number;
  revenuePerFTE: number | null;
  employeeCount: number;
}

export interface DepartmentBreakdown {
  [department: string]: DepartmentMetrics;
}

export interface DepartmentMetrics {
  fte: number;
  cost: number;
  avgCompensation: number;
  percentage: number;
  employeeCount: number;
}

export interface RatioMetrics {
  rdToGTM: number;
  managerToIC: number;
  avgSpanOfControl: number;
}

export interface OutlierAnalysis {
  highCostEmployees: OutlierEmployee[];
  lowSpanManagers: OutlierManager[];
  departmentImbalances: DepartmentImbalance[];
}

export interface OutlierEmployee {
  employeeId: string;
  department: string;
  role?: string;
  totalCompensation: number;
  zScore: number;
  deltaFromMean: number;
}

export interface OutlierManager {
  managerId: string;
  managerName?: string;
  department: string;
  directReportsCount: number;
  expectedMin: number;
}

export interface DepartmentImbalance {
  department: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
}

export interface BenchmarkMetric {
  min?: number;
  p25?: number;
  median: number;
  p75?: number;
  max?: number;
}

export interface ComparisonResult {
  value: number;
  benchmark: BenchmarkMetric;
  percentile: number;
  status: 'below' | 'within' | 'above';
  deltaPct: number;
  severity: 'low' | 'medium' | 'high';
}

export interface BenchmarkData {
  industry: string;
  companySize: string;
  source: string;
  sampleSize?: number;
  metrics: {
    rdToGTMRatio?: BenchmarkMetric;
    revenuePerFTE?: BenchmarkMetric;
    spanOfControl?: BenchmarkMetric;
    costPerFTE?: BenchmarkMetric;
    managerToIC?: BenchmarkMetric;
  };
}

export interface InsightRule {
  id: string;
  category: 'cost' | 'structure' | 'efficiency' | 'risk';
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  template: string;
  suggestedActions: string[];
}

export interface GeneratedInsight {
  id: string;
  category: 'cost' | 'structure' | 'efficiency' | 'risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metrics?: Record<string, any>;
  suggestedActions: string[];
  confidenceScore: number;
}

// Standard department categories
export type DepartmentCategory = 'R&D' | 'GTM' | 'G&A' | 'Operations' | 'Other';

// Scenario types
export interface ScenarioParams {
  type: 'freeze_hiring' | 'cost_reduction' | 'growth' | 'target_ratio' | 'custom';
  parameters: Record<string, any>;
}

export interface AffectedEmployee {
  id: string;
  employeeId: string;
  employeeName: string | null;
  department: string;
  role: string | null;
  totalCompensation: number;
  action: 'remove' | 'add';
  effectiveDate: Date | null;
  isNew?: boolean;
}

export interface MonthlyBurnRate {
  month: string; // e.g., "2025-01", "2025-02"
  baselineCost: number;
  scenarioCost: number;
  savings: number;
  effectiveEmployeeCount: number;
}

export interface RunwayAnalysis {
  currentCash: number | null;
  baselineRunwayMonths: number | null;
  scenarioRunwayMonths: number | null;
  runwayExtensionMonths: number | null;
  baselineRunoutDate: Date | null;
  scenarioRunoutDate: Date | null;
}

export interface YearEndProjection {
  year: number;
  baselineTotal: number;
  scenarioTotal: number;
  totalSavings: number;
  avgMonthlyBurn: number;
}

export interface ScenarioResult {
  baseline: SummaryMetrics;
  scenario: SummaryMetrics;
  delta: {
    fteChange: number;
    costSavings: number;
    costSavingsPct: number;
    ratioChange: number;
  };
  affectedEmployees?: AffectedEmployee[];
  monthlyBurnRate?: MonthlyBurnRate[];
  runway?: RunwayAnalysis;
  yearEndProjection?: YearEndProjection;
}

// Organizational Benchmark Types
export type BenchmarkType = 'STRUCTURE' | 'EFFICIENCY' | 'TENURE';

export interface OrganizationalBenchmarkInput {
  industry: string;
  region: string;
  companySize: string;
  growthStage?: string;
  benchmarkType: BenchmarkType;
  metricName: string;
  p10Value?: number;
  p25Value?: number;
  p50Value?: number;
  p75Value?: number;
  p90Value?: number;
  departmentData?: Record<string, any>;
  sampleSize: number;
  currency?: string;
  unit?: string;
  sourceId?: string;
  effectiveDate: Date;
  expirationDate?: Date;
  notes?: string;
  methodology?: string;
}

export interface OrganizationalBenchmarkData {
  id: string;
  industry: string;
  region: string;
  companySize: string;
  growthStage?: string;
  benchmarkType: BenchmarkType;
  metricName: string;
  p10Value?: number;
  p25Value?: number;
  p50Value?: number;
  p75Value?: number;
  p90Value?: number;
  departmentData?: Record<string, any>;
  sampleSize: number;
  currency?: string;
  unit?: string;
  sourceId?: string;
  effectiveDate: Date;
  expirationDate?: Date;
  lastVerified: Date;
  notes?: string;
  methodology?: string;
  source?: BenchmarkSourceData;
  createdAt: Date;
  updatedAt: Date;
}

export type SourceType = 'THIRD_PARTY' | 'MANUAL' | 'CROWDSOURCED';

export interface BenchmarkSourceInput {
  name: string;
  type: SourceType;
  website?: string;
  contactEmail?: string;
  description?: string;
  licenseType?: string;
  accessNotes?: string;
  lastContacted?: Date;
  reliability?: string;
  updateFrequency?: string;
}

export interface BenchmarkSourceData {
  id: string;
  name: string;
  type: SourceType;
  website?: string;
  contactEmail?: string;
  description?: string;
  licenseType?: string;
  accessNotes?: string;
  lastContacted?: Date;
  reliability?: string;
  updateFrequency?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BenchmarkAuditLogInput {
  resourceType: string;
  resourceId: string;
  action: string;
  userId?: string;
  sourceId?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  changeReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BenchmarkAuditLogData {
  id: string;
  resourceType: string;
  resourceId: string;
  action: string;
  userId?: string;
  sourceId?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  changeReason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Benchmark matching and filtering
export interface BenchmarkFilter {
  industry?: string;
  region?: string;
  companySize?: string;
  growthStage?: string;
  benchmarkType?: BenchmarkType;
  metricName?: string;
  effectiveAsOf?: Date; // Get benchmarks effective as of this date
}

// Helper type for benchmark comparison
export interface BenchmarkComparison {
  metricName: string;
  userValue: number;
  benchmark: {
    p10?: number;
    p25?: number;
    p50?: number;
    p75?: number;
    p90?: number;
  };
  percentile: number; // Where the user's value falls in the distribution
  status: 'below_p25' | 'p25_to_p50' | 'p50_to_p75' | 'above_p75';
  deltaFromMedian: number;
  deltaFromMedianPct: number;
  unit?: string;
}
