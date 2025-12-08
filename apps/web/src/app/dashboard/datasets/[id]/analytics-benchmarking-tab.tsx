'use client';

import { useEffect, useState } from 'react';
import BenchmarkComparison from './benchmark-comparison';
import EmployeeBenchmarkComparison from './employee-benchmark-comparison';
import EmployeeBenchmarkRangeView from './employee-benchmark-range-view';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface AnalyticsBenchmarkingTabProps {
  datasetId: string;
  currency: string;
  employees: any[];
  metrics: any;
  dataset: any;
}

interface BenchmarkData {
  benchmark?: {
    segment?: string;
    companySize?: string;
    metrics?: {
      rdToGTMRatio?: { p25: number; p50: number; p75: number } | null;
    };
  };
}

const loadingMessages = [
  'Counting employees...',
  'Analyzing department structures...',
  'Crunching industry benchmarks...',
  'Comparing with peer companies...',
  'Calculating efficiency ratios...',
  'Reviewing compensation data...',
  'Generating insights...',
];

export default function AnalyticsBenchmarkingTab({
  datasetId,
  currency,
  employees,
  metrics,
  dataset,
}: AnalyticsBenchmarkingTabProps) {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchBenchmarks() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/datasets/${datasetId}/benchmarks`);
        if (response.ok) {
          const data = await response.json();
          setBenchmarkData(data);
        }
      } catch (error) {
        console.error('Failed to fetch benchmarks:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBenchmarks();
  }, [datasetId]);

  if (!metrics) {
    return <div>No metrics available</div>;
  }

  // Calculate R&D to GTM ratio rating
  const rdToGTM = metrics.ratios.rdToGTM;
  let rdToGTMRating = 'Balanced';
  let rdToGTMColor = 'text-green-600';
  let rdToGTMBgColor = 'bg-green-50';

  if (rdToGTM > 3) {
    rdToGTMRating = 'Very R&D Heavy';
    rdToGTMColor = 'text-orange-600';
    rdToGTMBgColor = 'bg-orange-50';
  } else if (rdToGTM > 2) {
    rdToGTMRating = 'R&D Heavy';
    rdToGTMColor = 'text-blue-600';
    rdToGTMBgColor = 'bg-blue-50';
  } else if (rdToGTM < 1) {
    rdToGTMRating = 'GTM Heavy';
    rdToGTMColor = 'text-purple-600';
    rdToGTMBgColor = 'bg-purple-50';
  }

  // Group employees by role for role analysis
  const roleStats = employees.reduce((acc: any, emp: any) => {
    const role = emp.role || 'Unspecified';
    if (!acc[role]) {
      acc[role] = {
        count: 0,
        totalComp: 0,
        baseSalaries: [],
        bonuses: [],
        levels: {},
      };
    }
    acc[role].count++;
    acc[role].totalComp += emp.totalCompensation;
    if (emp.annualSalary) acc[role].baseSalaries.push(Number(emp.annualSalary));
    if (emp.bonus) acc[role].bonuses.push(Number(emp.bonus));

    const level = emp.level || 'Not Set';
    acc[role].levels[level] = (acc[role].levels[level] || 0) + 1;

    return acc;
  }, {});

  // Calculate role percentages
  const totalEmployees = employees.length;
  const rolePercentages = Object.entries(roleStats).map(([role, stats]: [string, any]) => ({
    role,
    count: stats.count,
    percentage: (stats.count / totalEmployees) * 100,
    avgComp: stats.totalComp / stats.count,
    avgBaseSalary: stats.baseSalaries.length > 0
      ? stats.baseSalaries.reduce((a: number, b: number) => a + b, 0) / stats.baseSalaries.length
      : 0,
    avgBonus: stats.bonuses.length > 0
      ? stats.bonuses.reduce((a: number, b: number) => a + b, 0) / stats.bonuses.length
      : 0,
    levels: stats.levels,
  })).sort((a, b) => b.count - a.count);

  // Count FTEs by level
  const levelCounts = employees.reduce((acc: any, emp: any) => {
    const level = emp.level || 'Not Set';
    acc[level] = (acc[level] || 0) + Number(emp.fteFactor || 1);
    return acc;
  }, {});

  // Show loading state while fetching benchmarks
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-900 animate-pulse">
            {loadingMessages[loadingMessageIndex]}
          </p>
          <p className="text-sm text-gray-500">
            Fetching benchmark data for your organization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* R&D to GTM Ratio Rating */}
      <div className={`rounded-lg border p-6 ${rdToGTMBgColor}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          R&D to GTM Ratio Analysis
        </h3>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-3xl font-bold text-gray-900">{rdToGTM.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Current Ratio</p>
          </div>
          <div className={`rounded-lg px-4 py-2 ${rdToGTMColor} font-semibold`}>
            {rdToGTMRating}
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-700">
          {rdToGTM > 2
            ? 'Your organization is heavily invested in R&D relative to Go-to-Market. This is common for early-stage product companies or deep-tech businesses.'
            : rdToGTM < 1
            ? 'Your organization is heavily invested in Go-to-Market relative to R&D. This is common for sales-driven or service-oriented businesses.'
            : 'Your organization has a balanced investment between R&D and Go-to-Market teams.'}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
          <span className="rounded bg-white px-2 py-1">
            {benchmarkData?.benchmark?.metrics?.rdToGTMRatio
              ? `Industry Benchmark: ${benchmarkData.benchmark.metrics.rdToGTMRatio.p25.toFixed(1)} - ${benchmarkData.benchmark.metrics.rdToGTMRatio.p75.toFixed(1)} (${benchmarkData.benchmark.segment})`
              : 'Loading benchmark...'}
          </span>
        </div>
      </div>

      {/* Individual Employee Benchmark Range View */}
      <EmployeeBenchmarkRangeView
        datasetId={datasetId}
        currency={currency}
      />

      {/* Department Benchmarking */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Department Headcount + Benchmarks
        </h3>
        <div className="space-y-3">
          {Object.entries(metrics.departments).map(([dept, data]: [string, any]) => (
            <div key={dept} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{dept}</p>
                <p className="text-sm text-gray-600">
                  {data.fte.toFixed(1)} FTE · {data.employeeCount} employees
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {data.percentage.toFixed(1)}% of total
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Analysis with Benchmarks */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Role Breakdown & Benchmarks
        </h3>
        <div className="space-y-3">
          {rolePercentages.slice(0, 10).map(({ role, count, percentage, avgComp }) => (
            <div key={role} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{role}</p>
                <p className="text-sm text-gray-600">
                  {count} {count === 1 ? 'employee' : 'employees'} · {percentage.toFixed(1)}% of total
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {currency} {(avgComp / 1000).toFixed(0)}k avg
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Salary Analysis */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Salary Analysis (€) – Cash Compensation (Base + Bonus)
        </h3>
        <div className="space-y-3">
          {rolePercentages
            .filter(r => r.avgBaseSalary > 0)
            .slice(0, 10)
            .map(({ role, count, avgBaseSalary, avgBonus }) => (
              <div key={role} className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{role}</p>
                  <p className="text-sm text-gray-600">{count} {count === 1 ? 'employee' : 'employees'}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Base Salary</p>
                    <p className="font-semibold text-gray-900">
                      {currency} {(avgBaseSalary / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Bonus</p>
                    <p className="font-semibold text-gray-900">
                      {avgBonus > 0 ? `${currency} ${(avgBonus / 1000).toFixed(0)}k` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Cash</p>
                    <p className="font-semibold text-gray-900">
                      {currency} {((avgBaseSalary + avgBonus) / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* FTE Count per Level */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          FTE Count per Level of Expertise
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(levelCounts)
            .sort((a, b) => {
              const levelOrder: any = { 'IC': 1, 'MANAGER': 2, 'DIRECTOR': 3, 'VP': 4, 'C_LEVEL': 5, 'Not Set': 6 };
              return (levelOrder[a[0]] || 99) - (levelOrder[b[0]] || 99);
            })
            .map(([level, count]: [string, any]) => (
              <div key={level} className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">{level === 'C_LEVEL' ? 'C-Level' : level}</p>
                <p className="text-2xl font-bold text-gray-900">{count.toFixed(1)}</p>
                <p className="text-xs text-gray-500">FTE</p>
              </div>
            ))}
        </div>
      </div>

      {/* Existing Benchmark Comparison Component */}
      <BenchmarkComparison
        datasetId={datasetId}
        currency={currency}
      />

      {/* AI-Powered Insights for Benchmarking */}
      <div className="rounded-lg border bg-blue-50 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          💡 Benchmarking Insights
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Benchmark data will be populated as more companies use the platform</li>
          <li>• External benchmark data sources will be integrated in future updates</li>
          <li>• Your data contributes to anonymized industry benchmarks (opt-in)</li>
        </ul>
      </div>
    </div>
  );
}
