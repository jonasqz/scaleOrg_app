'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface BenchmarkData {
  metrics: any;
  benchmark: {
    segment: string;
    companySize: string;
    metrics: {
      rdToGTMRatio?: { median: number; p25: number; p75: number };
      revenuePerFTE?: { median: number; p25: number; p75: number };
      spanOfControl?: { median: number; p25: number; p75: number };
      costPerFTE?: { median: number; p25: number; p75: number };
    };
  };
  comparisons: {
    rdToGTM: ComparisonResult | null;
    revenuePerFTE: ComparisonResult | null;
    spanOfControl: ComparisonResult | null;
    costPerFTE: ComparisonResult | null;
  };
  companySize: string;
}

interface ComparisonResult {
  status: 'below' | 'within' | 'above';
  severity: 'low' | 'medium' | 'high';
  percentile: number;
  actualValue: number;
  benchmarkMedian: number;
  benchmarkP25: number;
  benchmarkP75: number;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'above':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'below':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'above':
        return 'text-green-700 bg-green-100';
      case 'below':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${colors[severity as keyof typeof colors]}`}>
        {severity}
      </span>
    );
  };

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
      key: 'rdToGTM',
      label: 'R&D to GTM Ratio',
      comparison: data.comparisons.rdToGTM,
      format: (v: number) => formatValue(v),
    },
    {
      key: 'revenuePerFTE',
      label: 'Revenue per FTE',
      comparison: data.comparisons.revenuePerFTE,
      format: (v: number) => formatValue(v, true),
    },
    {
      key: 'spanOfControl',
      label: 'Span of Control',
      comparison: data.comparisons.spanOfControl,
      format: (v: number) => formatValue(v),
    },
    {
      key: 'costPerFTE',
      label: 'Cost per FTE',
      comparison: data.comparisons.costPerFTE,
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
        {metrics.map(({ key, label, comparison, format }) => {
          if (!comparison) {
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
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(comparison.status)}
                  <div>
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Your value: <span className="font-semibold">{format(comparison.actualValue)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(comparison.severity)}
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(comparison.status)}`}>
                    {comparison.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">25th percentile</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {format(comparison.benchmarkP25)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Median</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {format(comparison.benchmarkMedian)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">75th percentile</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {format(comparison.benchmarkP75)}
                  </p>
                </div>
              </div>

              {/* Visual percentile indicator */}
              <div className="mt-4">
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${comparison.percentile}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1 text-right">
                  {comparison.percentile.toFixed(0)}th percentile
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-900 text-sm mb-2">How to interpret</h3>
        <ul className="space-y-1 text-sm text-blue-700">
          <li><span className="font-semibold">Above:</span> Your metric is higher than the benchmark median</li>
          <li><span className="font-semibold">Within:</span> Your metric is within the 25th-75th percentile range</li>
          <li><span className="font-semibold">Below:</span> Your metric is lower than the benchmark median</li>
          <li className="mt-2 text-xs">
            Severity indicates how far you are from industry norms (low: good, high: needs attention)
          </li>
        </ul>
      </div>
    </div>
  );
}
