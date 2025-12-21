/**
 * Health Score Types
 *
 * Defines the data structures for organizational health scoring
 */

/**
 * Health score dimension categories
 */
export type HealthDimension =
  | 'financial_efficiency'
  | 'organizational_structure'
  | 'talent_retention'
  | 'pay_equity'
  | 'team_effectiveness'
  | 'cost_management';

/**
 * Status levels for scores
 */
export type HealthStatus = 'excellent' | 'good' | 'warning' | 'critical';

/**
 * Trend direction
 */
export type TrendDirection = 'improving' | 'stable' | 'declining' | 'unknown';

/**
 * Individual metric score within a dimension
 */
export interface MetricScore {
  metricId: string;
  name: string;
  value: number | null;
  score: number; // 0-100
  weight: number;
  status: HealthStatus;
  benchmark?: {
    low: number;
    median: number;
    high: number;
    userPosition: 'below' | 'within' | 'above';
  };
  formattedValue: string;
  unit: string;
}

/**
 * Dimension score aggregation
 */
export interface DimensionScore {
  dimension: HealthDimension;
  name: string;
  description: string;
  score: number; // 0-100, weighted average of metrics
  weight: number; // Weight in overall score (0-1, sums to 1.0)
  status: HealthStatus;
  metrics: MetricScore[];
  metricsAvailable: number; // Count of metrics with data
  metricsTotal: number; // Total possible metrics
  dataCompleteness: number; // Percentage (0-100)
}

/**
 * Overall health score
 */
export interface HealthScore {
  overallScore: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  status: HealthStatus;
  trend: TrendDirection;
  trendChange?: number; // Points change from previous calculation
  percentile?: number; // 0-100, compared to peer companies

  // Dimension breakdown
  dimensions: DimensionScore[];

  // Data quality
  dataCompleteness: number; // Overall percentage (0-100)
  calculatedAt: Date;

  // Insights
  strengths: string[]; // Top 3 strengths
  improvements: string[]; // Top 3 improvement areas
  recommendations: string[]; // Actionable recommendations

  // Summary metrics
  summary: {
    excellentDimensions: number;
    goodDimensions: number;
    warningDimensions: number;
    criticalDimensions: number;
  };
}

/**
 * Metric scoring rule definition
 */
export interface ScoringRule {
  metricId: string;
  name: string;
  description: string;
  dimension: HealthDimension;
  weight: number; // Weight within dimension
  unit: 'percentage' | 'currency' | 'ratio' | 'years' | 'count' | 'factor';

  // Scoring function type
  scoringType: 'benchmark' | 'threshold' | 'trend' | 'custom';

  // For benchmark-based scoring
  benchmarkKey?: string;
  invertScore?: boolean; // For metrics where lower is better

  // For threshold-based scoring
  thresholds?: {
    excellent: { min?: number; max?: number };
    good: { min?: number; max?: number };
    warning: { min?: number; max?: number };
    critical: { min?: number; max?: number };
  };

  // Custom scoring function
  customScore?: (value: number, benchmarks?: any) => number;
}

/**
 * Dimension definition
 */
export interface DimensionDefinition {
  id: HealthDimension;
  name: string;
  description: string;
  weight: number; // Weight in overall score (0-1)
  metrics: ScoringRule[];
}

/**
 * Historical health score snapshot
 */
export interface HealthScoreSnapshot {
  id: string;
  datasetId: string;
  score: number;
  dimensions: Record<HealthDimension, number>;
  calculatedAt: Date;
  metadata?: any;
}

/**
 * Health score comparison (for benchmarking)
 */
export interface HealthScoreComparison {
  yourScore: number;
  peerMedian: number;
  peerP25: number;
  peerP75: number;
  percentile: number;
  position: 'top' | 'above_average' | 'average' | 'below_average' | 'bottom';
}
