'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Users, TrendingUp, Briefcase } from 'lucide-react';
import MetricsCharts from './metrics-charts';
import InsightsDisplay from './insights-display';

interface AnalyticsGeneralTabProps {
  datasetId: string;
  currency: string;
  employees: any[];
  metrics: any;
  dataset: any;
  departmentCategories?: Record<string, string>;
}

interface BenchmarkData {
  benchmark?: {
    segment?: string;
    companySize?: string;
    metrics?: {
      rdToGTMRatio?: { p25: number; p50: number; p75: number } | null;
      revenuePerFTE?: { p25: number; p50: number; p75: number } | null;
      spanOfControl?: { p25: number; p50: number; p75: number } | null;
      costPerFTE?: { p25: number; p50: number; p75: number } | null;
    };
  };
}

export default function AnalyticsGeneralTab({
  datasetId,
  currency,
  employees,
  metrics,
  dataset,
  departmentCategories,
}: AnalyticsGeneralTabProps) {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);

  useEffect(() => {
    async function fetchBenchmarks() {
      try {
        const response = await fetch(`/api/datasets/${datasetId}/benchmarks`);
        if (response.ok) {
          const data = await response.json();
          setBenchmarkData(data);
        }
      } catch (error) {
        console.error('Failed to fetch benchmarks:', error);
      }
    }
    fetchBenchmarks();
  }, [datasetId]);

  if (!metrics) {
    return <div>No metrics available</div>;
  }

  // Calculate additional KPIs
  const totalRevenue = dataset.totalRevenue ? Number(dataset.totalRevenue) : 0;
  const totalFTE = metrics.summary.totalFTE;
  const avgRevenuePerFTE = totalRevenue > 0 ? totalRevenue / totalFTE : 0;

  // Use centralized metrics from calculations package
  const rdFTE = metrics.departments['R&D']?.fte || 0;
  const gtmFTE = metrics.departments['GTM']?.fte || 0;

  // Calculate more granular GTM breakdown for specific metrics
  // Use settings to identify GTM departments, then filter by sales/marketing keywords
  const salesFTE = employees
    .filter(emp => {
      const category = departmentCategories?.[emp.department];
      const isGTM = category === 'GTM';
      const isSales = emp.department?.toLowerCase().includes('sales');
      return isGTM && isSales;
    })
    .reduce((sum, emp) => sum + (Number(emp.fteFactor) || 1), 0);

  const marketingFTE = employees
    .filter(emp => {
      const category = departmentCategories?.[emp.department];
      const isGTM = category === 'GTM';
      const isMarketing = emp.department?.toLowerCase().includes('marketing');
      return isGTM && isMarketing;
    })
    .reduce((sum, emp) => sum + (Number(emp.fteFactor) || 1), 0);

  const revenuePerSalesFTE = totalRevenue > 0 && salesFTE > 0 ? totalRevenue / salesFTE : 0;
  const revenuePerMarketingFTE = totalRevenue > 0 && marketingFTE > 0 ? totalRevenue / marketingFTE : 0;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {currency} {(totalRevenue / 1000000).toFixed(1)}M
          </p>
          <p className="text-sm text-gray-600">Total Revenue</p>
          {!totalRevenue && (
            <p className="mt-1 text-xs text-yellow-600">Not configured</p>
          )}
        </div>

        {/* Total FTEs with Benchmark */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {totalFTE.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600">Total FTE</p>
        </div>

        {/* Avg Revenue per FTE with Benchmark */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {totalRevenue > 0 ? `${currency} ${(avgRevenuePerFTE / 1000).toFixed(0)}k` : 'N/A'}
          </p>
          <p className="text-sm text-gray-600">Avg Revenue per FTE</p>
          {totalRevenue > 0 && benchmarkData?.benchmark?.metrics?.revenuePerFTE && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">
                {currency} {(benchmarkData.benchmark.metrics.revenuePerFTE.p25 / 1000).toFixed(0)}k - {(benchmarkData.benchmark.metrics.revenuePerFTE.p75 / 1000).toFixed(0)}k
              </span>
            </div>
          )}
        </div>

        {/* R&D FTE with Benchmark */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Briefcase className="h-8 w-8 text-indigo-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {rdFTE.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600">R&D FTE</p>
          <p className="mt-1 text-xs text-gray-500">
            Engineering, Product, Design
          </p>
        </div>
      </div>

      {/* Second Row of KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* R&D to GTM Ratio with Benchmark */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {metrics.ratios.rdToGTM.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">R&D to GTM Ratio</p>
          {benchmarkData?.benchmark?.metrics?.rdToGTMRatio && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">
                {benchmarkData.benchmark.metrics.rdToGTMRatio.p25.toFixed(1)} - {benchmarkData.benchmark.metrics.rdToGTMRatio.p75.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Revenue per Sales FTE */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-cyan-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {revenuePerSalesFTE > 0 ? `${currency} ${(revenuePerSalesFTE / 1000).toFixed(0)}k` : 'N/A'}
          </p>
          <p className="text-sm text-gray-600">Revenue per Sales FTE</p>
          {salesFTE === 0 && (
            <p className="mt-1 text-xs text-gray-500">No sales FTEs</p>
          )}
        </div>

        {/* Revenue per Marketing FTE */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-pink-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {revenuePerMarketingFTE > 0 ? `${currency} ${(revenuePerMarketingFTE / 1000).toFixed(0)}k` : 'N/A'}
          </p>
          <p className="text-sm text-gray-600">Revenue per Marketing FTE</p>
          {marketingFTE === 0 && (
            <p className="mt-1 text-xs text-gray-500">No marketing FTEs</p>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <MetricsCharts
        departments={metrics.departments}
        currency={currency}
      />

      {/* AI-Powered Insights */}
      <InsightsDisplay
        metrics={metrics}
        currency={currency}
      />
    </div>
  );
}
