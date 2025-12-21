/**
 * Health Score Scoring Engine
 *
 * Core logic for scoring individual metrics based on benchmarks and thresholds
 */

import type { ScoringRule, HealthStatus, MetricScore } from './types';

/**
 * Convert score (0-100) to health status
 */
export function scoreToStatus(score: number): HealthStatus {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

/**
 * Score a metric value against benchmark ranges
 *
 * @param value - The metric value to score
 * @param benchmark - Benchmark data with p25, p50, p75
 * @param invertScore - If true, lower values score higher (for cost metrics)
 * @returns Score from 0-100
 */
export function scoreBenchmark(
  value: number,
  benchmark: { low: number; median: number; high: number } | null,
  invertScore: boolean = false
): number {
  if (!benchmark) {
    // No benchmark available - return neutral score
    return 50;
  }

  const { low, median, high } = benchmark;

  // Handle inverted scoring (lower is better)
  if (invertScore) {
    // Flip the value so lower becomes higher for scoring purposes
    const range = high - low;
    if (range === 0) return 50;

    if (value <= low) return 100; // Much better than benchmark
    if (value >= high) return 0; // Much worse than benchmark

    // Linear interpolation between low and high
    if (value <= median) {
      // Between low (best) and median
      return 100 - ((value - low) / (median - low)) * 30;
    } else {
      // Between median and high (worst)
      return 70 - ((value - median) / (high - median)) * 70;
    }
  }

  // Normal scoring (higher is better)
  const range = high - low;
  if (range === 0) return 50;

  if (value >= high) return 100; // Much better than benchmark
  if (value <= low) return 0; // Much worse than benchmark

  // Linear interpolation between low and high
  if (value >= median) {
    // Between median and high (best)
    return 70 + ((value - median) / (high - median)) * 30;
  } else {
    // Between low (worst) and median
    return ((value - low) / (median - low)) * 70;
  }
}

/**
 * Score a metric value against threshold ranges
 *
 * @param value - The metric value to score
 * @param thresholds - Threshold definitions for each status level
 * @param invertScore - If true, adjust thresholds for inverted scoring
 * @returns Score from 0-100
 */
export function scoreThreshold(
  value: number,
  thresholds: {
    excellent?: { min?: number; max?: number };
    good?: { min?: number; max?: number };
    warning?: { min?: number; max?: number };
    critical?: { min?: number; max?: number };
  },
  invertScore: boolean = false
): number {
  // Check excellent range
  if (thresholds.excellent) {
    const { min = -Infinity, max = Infinity } = thresholds.excellent;
    if (value >= min && value <= max) {
      // Within excellent range - score 85-100 based on position
      const range = max - min;
      if (range === 0) return 92.5;
      const position = (value - min) / range;
      return 85 + position * 15;
    }
  }

  // Check good range
  if (thresholds.good) {
    const { min = -Infinity, max = Infinity } = thresholds.good;
    if (value >= min && value <= max) {
      // Within good range - score 70-84
      const range = max - min;
      if (range === 0) return 77;
      const position = (value - min) / range;
      return 70 + position * 14;
    }
  }

  // Check warning range
  if (thresholds.warning) {
    const { min = -Infinity, max = Infinity } = thresholds.warning;
    if (value >= min && value <= max) {
      // Within warning range - score 50-69
      const range = max - min;
      if (range === 0) return 59.5;
      const position = (value - min) / range;
      return 50 + position * 19;
    }
  }

  // Check critical range
  if (thresholds.critical) {
    const { min = -Infinity, max = Infinity } = thresholds.critical;
    if (value >= min && value <= max) {
      // Within critical range - score 0-49
      const range = max - min;
      if (range === 0) return 24.5;
      const position = (value - min) / range;
      return position * 49;
    }
  }

  // Outside all ranges - return minimum score
  return 0;
}

/**
 * Format a metric value based on its unit
 */
export function formatMetricValue(value: number | null, unit: string): string {
  if (value === null) return 'N/A';

  switch (unit) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}k`;
      }
      return value.toFixed(0);
    case 'ratio':
      return `${value.toFixed(2)}`;
    case 'years':
      return `${value.toFixed(1)} yrs`;
    case 'count':
      return Math.round(value).toString();
    case 'factor':
      return `${value.toFixed(2)}x`;
    default:
      return value.toFixed(2);
  }
}

/**
 * Score a single metric based on its scoring rule
 *
 * @param rule - The scoring rule definition
 * @param value - The metric value to score
 * @param benchmarks - Available benchmark data
 * @returns MetricScore object
 */
export function scoreMetric(
  rule: ScoringRule,
  value: number | null,
  benchmarks?: Record<string, { low: number; median: number; high: number }>
): MetricScore {
  // Handle null values
  if (value === null) {
    return {
      metricId: rule.metricId,
      name: rule.name,
      value: null,
      score: 0,
      weight: rule.weight,
      status: 'critical',
      formattedValue: 'N/A',
      unit: rule.unit,
    };
  }

  let score: number;
  let benchmark: { low: number; median: number; high: number; userPosition: 'below' | 'within' | 'above' } | undefined;

  switch (rule.scoringType) {
    case 'benchmark': {
      const benchmarkData = rule.benchmarkKey && benchmarks ? benchmarks[rule.benchmarkKey] : null;
      score = scoreBenchmark(value, benchmarkData, rule.invertScore || false);

      if (benchmarkData) {
        let userPosition: 'below' | 'within' | 'above';
        if (value < benchmarkData.low) {
          userPosition = rule.invertScore ? 'above' : 'below';
        } else if (value > benchmarkData.high) {
          userPosition = rule.invertScore ? 'below' : 'above';
        } else {
          userPosition = 'within';
        }

        benchmark = {
          ...benchmarkData,
          userPosition,
        };
      }
      break;
    }

    case 'threshold': {
      if (!rule.thresholds) {
        score = 50; // No thresholds defined
      } else {
        score = scoreThreshold(value, rule.thresholds, rule.invertScore || false);
      }
      break;
    }

    case 'custom': {
      if (rule.customScore) {
        score = rule.customScore(value, benchmarks);
      } else {
        score = 50; // No custom function defined
      }
      break;
    }

    case 'trend': {
      // Trend-based scoring would require historical data
      // For now, return neutral score
      score = 50;
      break;
    }

    default:
      score = 50;
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    metricId: rule.metricId,
    name: rule.name,
    value,
    score,
    weight: rule.weight,
    status: scoreToStatus(score),
    benchmark,
    formattedValue: formatMetricValue(value, rule.unit),
    unit: rule.unit,
  };
}

/**
 * Calculate weighted average score for a set of metrics
 *
 * @param metrics - Array of scored metrics
 * @returns Weighted average score (0-100)
 */
export function calculateWeightedScore(metrics: MetricScore[]): number {
  // Filter out metrics with null values
  const validMetrics = metrics.filter((m) => m.value !== null);

  if (validMetrics.length === 0) {
    return 0;
  }

  // Calculate total weight of valid metrics
  const totalWeight = validMetrics.reduce((sum, m) => sum + m.weight, 0);

  if (totalWeight === 0) {
    return 0;
  }

  // Calculate weighted score
  const weightedSum = validMetrics.reduce((sum, m) => sum + m.score * m.weight, 0);

  return weightedSum / totalWeight;
}

/**
 * Convert numeric score to letter grade
 */
export function scoreToGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

/**
 * Determine trend direction from historical scores
 */
export function calculateTrend(
  currentScore: number,
  previousScore?: number
): { direction: 'improving' | 'stable' | 'declining' | 'unknown'; change?: number } {
  if (previousScore === undefined) {
    return { direction: 'unknown' };
  }

  const change = currentScore - previousScore;

  if (Math.abs(change) < 2) {
    return { direction: 'stable', change };
  }

  return {
    direction: change > 0 ? 'improving' : 'declining',
    change,
  };
}
