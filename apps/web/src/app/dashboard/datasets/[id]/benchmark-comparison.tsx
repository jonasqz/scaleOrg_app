'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface BenchmarkData {
  benchmark: {
    segment: string;
    companySize: string;
    metrics: {
      rdToGTMRatio?: { p25: number; p50: number; p75: number };
      revenuePerFTE?: { p25: number; p50: number; p75: number };
      spanOfControl?: { p25: number; p50: number; p75: number };
      costPerFTE?: { p25: number; p50: number; p75: number };
    };
  };
  companySize: string;
}

interface BenchmarkComparisonProps {
  datasetId: string;
  currency: string;
}

export default function BenchmarkComparison({ datasetId, currency }: BenchmarkComparisonProps) {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBenchmarks() {
      try {
        const response = await fetch(`/api/datasets/${datasetId}/benchmarks`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch benchmarks');
        }
        const benchmarkData = await response.json();
        setData(benchmarkData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchBenchmarks();
  }, [datasetId]);

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading benchmarks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">Benchmarks Unavailable</h3>
            <p className="text-sm text-yellow-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatValue = (value: number | undefined | null, isRevenue: boolean = false, isCost: boolean = false) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    if (isRevenue || isCost) {
      return `${currency} ${(value / 1000).toFixed(0)}k`;
    }
    return value.toFixed(2);
  };

  const metrics = [
    {
      key: 'rdToGTMRatio',
      label: 'R&D to GTM Ratio',
      benchmarkData: data.benchmark?.metrics?.rdToGTMRatio,
      format: (v: number) => formatValue(v),
    },
    {
      key: 'revenuePerFTE',
      label: 'Revenue per FTE',
      benchmarkData: data.benchmark?.metrics?.revenuePerFTE,
      format: (v: number) => formatValue(v, true),
    },
    {
      key: 'spanOfControl',
      label: 'Span of Control',
      benchmarkData: data.benchmark?.metrics?.spanOfControl,
      format: (v: number) => formatValue(v),
    },
    {
      key: 'costPerFTE',
      label: 'Cost per FTE',
      benchmarkData: data.benchmark?.metrics?.costPerFTE,
      format: (v: number) => formatValue(v, false, true),
    },
  ];

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Benchmark Comparison</h2>
        <p className="text-sm text-gray-600 mt-1">
          Comparing against {data.benchmark?.segment?.replace(/_/g, ' ').toUpperCase() || 'industry'} companies with {data.companySize} employees
        </p>
      </div>

      <div className="space-y-4">
        {metrics.map(({ key, label, benchmarkData, format }) => {
          if (!benchmarkData) {
            return (
              <div key={key} className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500 mt-1">No benchmark data available</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={key} className="rounded-lg border p-4 hover:bg-gray-50 transition-colors">
              <div className="mb-3">
                <p className="font-medium text-gray-900">{label}</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  Industry benchmark range
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">25th percentile</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {format(benchmarkData.p25)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Median (P50)</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {format(benchmarkData.p50)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">75th percentile</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {format(benchmarkData.p75)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-900 text-sm mb-2">How to interpret</h3>
        <ul className="space-y-1 text-sm text-blue-700">
          <li><span className="font-semibold">P25 (25th percentile):</span> 25% of companies are below this value</li>
          <li><span className="font-semibold">P50 (Median):</span> The middle value - 50% of companies are below this</li>
          <li><span className="font-semibold">P75 (75th percentile):</span> 75% of companies are below this value</li>
          <li className="mt-2 text-xs">
            Compare your organization's metrics to these ranges to understand your position in the market
          </li>
        </ul>
      </div>
    </div>
  );
}
