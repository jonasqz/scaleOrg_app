'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface EmployeeBenchmarkData {
  id: string;
  name: string;
  role: string;
  level: string;
  totalCompensation: number;
  benchmark: {
    p25: number;
    p50: number;
    p75: number;
    currency: string;
  } | null;
  marketPosition: {
    percentDiff: number;
    status: 'above' | 'on' | 'below';
    percentile: number | null;
  } | null;
}

interface EmployeeBenchmarkResponse {
  employees: EmployeeBenchmarkData[];
  levelGroups: Record<string, EmployeeBenchmarkData[]>;
  summary: {
    totalEmployees: number;
    benchmarkedEmployees: number;
    averageMarketPosition: number;
  };
}

interface EmployeeBenchmarkComparisonProps {
  datasetId: string;
  currency: string;
}

export default function EmployeeBenchmarkComparison({
  datasetId,
  currency,
}: EmployeeBenchmarkComparisonProps) {
  const [benchmarkData, setBenchmarkData] = useState<EmployeeBenchmarkResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployeeBenchmarks() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/datasets/${datasetId}/employee-benchmarks`);
        if (response.ok) {
          const data = await response.json();
          setBenchmarkData(data);
        } else {
          console.error('Failed to fetch employee benchmarks');
        }
      } catch (error) {
        console.error('Error fetching employee benchmarks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployeeBenchmarks();
  }, [datasetId]);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-600">Loading employee benchmarks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!benchmarkData) {
    return null;
  }

  const { levelGroups, summary } = benchmarkData;

  // Level order for sorting
  const levelOrder: Record<string, number> = {
    'C_LEVEL': 1,
    'VP': 2,
    'DIRECTOR': 3,
    'MANAGER': 4,
    'IC': 5,
    'Not Set': 99,
  };

  // Sort level groups by seniority
  const sortedLevels = Object.keys(levelGroups).sort(
    (a, b) => (levelOrder[a] || 99) - (levelOrder[b] || 99)
  );

  // Helper to get visual indicator
  const getMarketPositionIndicator = (marketPosition: EmployeeBenchmarkData['marketPosition']) => {
    if (!marketPosition) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'text-gray-400',
        bgColor: 'bg-gray-100',
        label: 'No benchmark data',
      };
    }

    if (marketPosition.status === 'above') {
      return {
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        label: `+${marketPosition.percentDiff}% above market`,
      };
    } else if (marketPosition.status === 'below') {
      return {
        icon: <TrendingDown className="w-4 h-4" />,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: `${marketPosition.percentDiff}% below market`,
      };
    } else {
      return {
        icon: <Minus className="w-4 h-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: `${marketPosition.percentDiff >= 0 ? '+' : ''}${marketPosition.percentDiff}% on market`,
      };
    }
  };

  // Helper to format level display name
  const formatLevelName = (level: string): string => {
    if (level === 'C_LEVEL') return 'C-Level';
    if (level === 'Not Set') return 'Level Not Set';
    return level.charAt(0) + level.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Individual Employee Benchmark Comparison
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalEmployees}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Benchmarked</p>
            <p className="text-2xl font-bold text-gray-900">{summary.benchmarkedEmployees}</p>
            <p className="text-xs text-gray-500">
              {summary.totalEmployees > 0
                ? `${Math.round((summary.benchmarkedEmployees / summary.totalEmployees) * 100)}% coverage`
                : '0% coverage'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Market Position</p>
            <p className={`text-2xl font-bold ${
              summary.averageMarketPosition > 5 ? 'text-orange-600' :
              summary.averageMarketPosition < -5 ? 'text-red-600' :
              'text-green-600'
            }`}>
              {summary.averageMarketPosition >= 0 ? '+' : ''}{summary.averageMarketPosition}%
            </p>
          </div>
        </div>
      </div>

      {/* Employee Groups by Level */}
      {sortedLevels.map((level) => {
        const employees = levelGroups[level];
        if (!employees || employees.length === 0) return null;

        return (
          <div key={level} className="rounded-lg border bg-white p-6 shadow-sm">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              {formatLevelName(level)} ({employees.length})
            </h4>
            <div className="space-y-3">
              {employees.map((employee) => {
                const indicator = getMarketPositionIndicator(employee.marketPosition);

                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        {/* Visual indicator dot */}
                        <div className={`w-3 h-3 rounded-full ${indicator.bgColor} flex items-center justify-center`}>
                          <div className={`w-2 h-2 rounded-full ${indicator.color.replace('text-', 'bg-')}`}></div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{employee.name}</p>
                          <p className="text-sm text-gray-600">{employee.role}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 ml-4">
                      {/* Compensation */}
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {currency} {(employee.totalCompensation / 1000).toFixed(0)}k
                        </p>
                        <p className="text-xs text-gray-500">Total Comp</p>
                      </div>

                      {/* Market Position */}
                      {employee.marketPosition && employee.benchmark ? (
                        <div className="text-right min-w-[140px]">
                          <div className={`flex items-center gap-1 justify-end ${indicator.color}`}>
                            {indicator.icon}
                            <span className="font-semibold text-sm">
                              {employee.marketPosition.percentDiff >= 0 ? '+' : ''}
                              {employee.marketPosition.percentDiff}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Market: {currency} {(employee.benchmark.p50 / 1000).toFixed(0)}k
                          </p>
                        </div>
                      ) : (
                        <div className="text-right min-w-[140px]">
                          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                            <AlertCircle className="w-3 h-3" />
                            No benchmark
                          </p>
                        </div>
                      )}

                      {/* Percentile indicator */}
                      {employee.marketPosition?.percentile && (
                        <div className="text-right min-w-[60px]">
                          <p className="text-xs text-gray-600 font-medium">
                            p{Math.round(employee.marketPosition.percentile)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Info box */}
      {summary.benchmarkedEmployees < summary.totalEmployees && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Limited Benchmark Coverage</p>
              <p>
                {summary.totalEmployees - summary.benchmarkedEmployees} employees don't have matching
                benchmark data yet. This may be due to uncommon role titles or missing seniority levels.
                Benchmark coverage will improve as more data becomes available.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
