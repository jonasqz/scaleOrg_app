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

export interface ScenarioResult {
  baseline: SummaryMetrics;
  scenario: SummaryMetrics;
  delta: {
    fteChange: number;
    costSavings: number;
    costSavingsPct: number;
    ratioChange: number;
  };
}
