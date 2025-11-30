// Static benchmark data (MVP - will be replaced with database)

import type { BenchmarkData } from '@scleorg/types';

export const DEFAULT_BENCHMARKS: BenchmarkData[] = [
  {
    industry: 'saas_b2b',
    companySize: '50-100',
    source: 'openview_2024',
    sampleSize: 127,
    metrics: {
      rdToGTMRatio: {
        p25: 0.8,
        median: 1.0,
        p75: 1.3,
        min: 0.5,
        max: 2.0,
      },
      revenuePerFTE: {
        p25: 150000,
        median: 200000,
        p75: 280000,
        min: 100000,
        max: 400000,
      },
      spanOfControl: {
        p25: 4,
        median: 6,
        p75: 8,
        min: 2,
        max: 12,
      },
      costPerFTE: {
        p25: 80000,
        median: 110000,
        p75: 145000,
        min: 60000,
        max: 200000,
      },
      managerToIC: {
        p25: 0.10,
        median: 0.15,
        p75: 0.20,
        min: 0.05,
        max: 0.30,
      },
    },
  },
  {
    industry: 'saas_b2b',
    companySize: '100-250',
    source: 'openview_2024',
    sampleSize: 89,
    metrics: {
      rdToGTMRatio: {
        p25: 0.9,
        median: 1.1,
        p75: 1.4,
        min: 0.6,
        max: 2.2,
      },
      revenuePerFTE: {
        p25: 175000,
        median: 220000,
        p75: 300000,
        min: 120000,
        max: 450000,
      },
      spanOfControl: {
        p25: 5,
        median: 7,
        p75: 9,
        min: 3,
        max: 15,
      },
      costPerFTE: {
        p25: 90000,
        median: 120000,
        p75: 155000,
        min: 70000,
        max: 220000,
      },
      managerToIC: {
        p25: 0.12,
        median: 0.16,
        p75: 0.22,
        min: 0.08,
        max: 0.35,
      },
    },
  },
  {
    industry: 'saas_b2b',
    companySize: '250-500',
    source: 'openview_2024',
    sampleSize: 54,
    metrics: {
      rdToGTMRatio: {
        p25: 1.0,
        median: 1.2,
        p75: 1.5,
        min: 0.7,
        max: 2.5,
      },
      revenuePerFTE: {
        p25: 200000,
        median: 250000,
        p75: 350000,
        min: 150000,
        max: 500000,
      },
      spanOfControl: {
        p25: 6,
        median: 8,
        p75: 10,
        min: 4,
        max: 18,
      },
      costPerFTE: {
        p25: 100000,
        median: 130000,
        p75: 165000,
        min: 80000,
        max: 240000,
      },
      managerToIC: {
        p25: 0.14,
        median: 0.18,
        p75: 0.24,
        min: 0.10,
        max: 0.40,
      },
    },
  },
];
