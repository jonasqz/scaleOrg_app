// Benchmark comparison functions

import type {
  BenchmarkMetric,
  ComparisonResult,
  BenchmarkData,
} from '@scleorg/types';

export function compareToBenchmark(
  value: number,
  benchmark: BenchmarkMetric
): ComparisonResult {
  // Calculate percentile (simplified estimation)
  let percentile: number;
  if (benchmark.p25 && value <= benchmark.p25) {
    percentile = 25;
  } else if (value <= benchmark.median) {
    percentile = 50;
  } else if (benchmark.p75 && value <= benchmark.p75) {
    percentile = 75;
  } else {
    percentile = 90;
  }

  // Determine status
  let status: ComparisonResult['status'];
  if (benchmark.p25 && value < benchmark.p25) {
    status = 'below';
  } else if (benchmark.p75 && value > benchmark.p75) {
    status = 'above';
  } else {
    status = 'within';
  }

  // Calculate delta percentage
  const deltaPct = ((value - benchmark.median) / benchmark.median) * 100;

  // Determine severity
  let severity: ComparisonResult['severity'];
  const absDelta = Math.abs(deltaPct);
  if (absDelta < 15) {
    severity = 'low';
  } else if (absDelta < 30) {
    severity = 'medium';
  } else {
    severity = 'high';
  }

  return {
    value,
    benchmark,
    percentile,
    status,
    deltaPct,
    severity,
  };
}

export function getBenchmarkForSegment(
  industry: string,
  companySize: string,
  allBenchmarks: BenchmarkData[]
): BenchmarkData | null {
  // Find exact match first
  const exactMatch = allBenchmarks.find(
    (b) => b.industry === industry && b.companySize === companySize
  );

  if (exactMatch) return exactMatch;

  // Fall back to industry match
  const industryMatch = allBenchmarks.find((b) => b.industry === industry);
  if (industryMatch) return industryMatch;

  // Fall back to generic SaaS benchmarks
  const defaultMatch = allBenchmarks.find(
    (b) => b.industry === 'saas_b2b' && b.companySize === '100-250'
  );

  return defaultMatch || null;
}
