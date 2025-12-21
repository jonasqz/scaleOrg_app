/**
 * Health Score Module
 *
 * Exports all health score functionality
 */

export { calculateHealthScore } from './calculator';
export { DIMENSION_DEFINITIONS, getDimensionDefinition, getAllMetricDefinitions, getMetricDefinition } from './definitions';
export {
  scoreToStatus,
  scoreBenchmark,
  scoreThreshold,
  formatMetricValue,
  scoreMetric,
  calculateWeightedScore,
  scoreToGrade,
  calculateTrend,
} from './scoring-engine';

export type {
  HealthDimension,
  HealthStatus,
  TrendDirection,
  MetricScore,
  DimensionScore,
  HealthScore,
  ScoringRule,
  DimensionDefinition,
  HealthScoreSnapshot,
  HealthScoreComparison,
} from './types';
