'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Settings } from 'lucide-react';
import Link from 'next/link';

interface KPIValue {
  kpiId: string;
  value: number | null;
  formattedValue: string;
  status?: 'good' | 'warning' | 'bad';
  benchmarkComparison?: {
    low: number;
    median: number;
    high: number;
  };
  definition: {
    id: string;
    name: string;
    description: string;
    category: string;
    unit: string;
    formula: string;
  };
}

interface KPIDashboardProps {
  datasetId: string;
}

export default function KPIDashboard({ datasetId }: KPIDashboardProps) {
  const [kpis, setKpis] = useState<KPIValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadKPIs();
  }, [datasetId]);

  // Reload KPIs when page becomes visible or focused (e.g., after navigating back from settings)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadKPIs();
      }
    };

    const handleFocus = () => {
      loadKPIs();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [datasetId]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/datasets/${datasetId}/kpis`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load KPIs');
      }

      setKpis(data.kpis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status?: 'good' | 'warning' | 'bad') => {
    switch (status) {
      case 'good':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'bad':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: 'good' | 'warning' | 'bad') => {
    switch (status) {
      case 'good':
        return 'border-green-200 bg-green-50';
      case 'bad':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-stone-200 bg-white';
    }
  };

  const getStatusTextColor = (status?: 'good' | 'warning' | 'bad') => {
    switch (status) {
      case 'good':
        return 'text-green-900';
      case 'bad':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      default:
        return 'text-stone-900';
    }
  };

  const groupedKPIs = kpis.reduce((acc, kpi) => {
    const category = kpi.definition.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(kpi);
    return acc;
  }, {} as Record<string, KPIValue[]>);

  const categoryNames: Record<string, string> = {
    overall: 'Overall Metrics',
    customer_success: 'Customer Success & Support',
    engineering: 'Engineering & Technology',
    finance: 'Finance',
    hr: 'Human Resources',
    legal: 'Legal',
    marketing: 'Marketing',
    operations: 'Operations',
    product: 'Product',
    professional_services: 'Professional Services',
    sales: 'Sales',
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
        <p className="text-sm text-stone-600">Loading KPIs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
        <p className="text-sm text-stone-600 mb-2">No KPIs configured</p>
        <Link
          href={`/dashboard/datasets/${datasetId}/settings`}
          className="text-xs text-orange-600 hover:text-orange-700"
        >
          Configure KPIs →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Key Performance Indicators</h2>
          <p className="text-xs text-stone-500 mt-1">
            Benchmarking metrics for your organization
          </p>
        </div>
        <Link
          href={`/dashboard/datasets/${datasetId}/settings?tab=kpis`}
          className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          Manage KPIs
        </Link>
      </div>

      {/* KPIs by Category */}
      {Object.entries(groupedKPIs).map(([category, categoryKPIs]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">
            {categoryNames[category] || category}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryKPIs.map((kpi) => (
              <div
                key={kpi.kpiId}
                className={`rounded-lg border p-4 transition-all ${getStatusColor(kpi.status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-xs font-medium text-stone-600 line-clamp-2">
                    {kpi.definition.name}
                  </h4>
                  {getStatusIcon(kpi.status)}
                </div>

                <div className={`text-2xl font-bold mb-1 ${getStatusTextColor(kpi.status)}`}>
                  {kpi.formattedValue}
                </div>

                {kpi.benchmarkComparison && kpi.value !== null && (
                  <div className="text-[10px] text-stone-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Benchmark Range:</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low:</span>
                      <span className="font-medium">
                        {kpi.definition.unit === 'percentage'
                          ? `${kpi.benchmarkComparison.low.toFixed(1)}%`
                          : kpi.definition.unit === 'currency'
                          ? `$${(kpi.benchmarkComparison.low / 1000000).toFixed(2)}M`
                          : kpi.definition.unit === 'ratio'
                          ? `${kpi.benchmarkComparison.low.toFixed(2)}:1`
                          : kpi.benchmarkComparison.low.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Median:</span>
                      <span className="font-medium">
                        {kpi.definition.unit === 'percentage'
                          ? `${kpi.benchmarkComparison.median.toFixed(1)}%`
                          : kpi.definition.unit === 'currency'
                          ? `$${(kpi.benchmarkComparison.median / 1000000).toFixed(2)}M`
                          : kpi.definition.unit === 'ratio'
                          ? `${kpi.benchmarkComparison.median.toFixed(2)}:1`
                          : kpi.benchmarkComparison.median.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>High:</span>
                      <span className="font-medium">
                        {kpi.definition.unit === 'percentage'
                          ? `${kpi.benchmarkComparison.high.toFixed(1)}%`
                          : kpi.definition.unit === 'currency'
                          ? `$${(kpi.benchmarkComparison.high / 1000000).toFixed(2)}M`
                          : kpi.definition.unit === 'ratio'
                          ? `${kpi.benchmarkComparison.high.toFixed(2)}:1`
                          : kpi.benchmarkComparison.high.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-stone-500 mt-2 line-clamp-2">
                  {kpi.definition.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
