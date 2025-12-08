'use client';

import { useEffect, useState } from 'react';
import { Target, AlertCircle } from 'lucide-react';

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

interface EmployeeBenchmarkRangeViewProps {
  datasetId: string;
  currency: string;
}

// Helper to extract role family from role title
function extractRoleFamily(role: string): string {
  const roleLower = role.toLowerCase();

  if (roleLower.includes('engineer') || roleLower.includes('developer') || roleLower.includes('software')) {
    return 'Tech Team';
  } else if (roleLower.includes('sales') || roleLower.includes('account executive')) {
    return 'Sales Team';
  } else if (roleLower.includes('marketing')) {
    return 'Marketing Team';
  } else if (roleLower.includes('product')) {
    return 'Product Team';
  } else if (roleLower.includes('design')) {
    return 'Design Team';
  } else if (roleLower.includes('finance') || roleLower.includes('accounting')) {
    return 'Finance Team';
  } else if (roleLower.includes('hr') || roleLower.includes('people')) {
    return 'People Team';
  } else if (roleLower.includes('operations') || roleLower.includes('ops')) {
    return 'Operations Team';
  }

  return 'Other';
}

// Helper to format level display name
function formatLevelName(level: string): string {
  if (level === 'C_LEVEL') return 'C-Level';
  if (level === 'Not Set') return 'Level Not Set';
  return level.charAt(0) + level.slice(1).toLowerCase();
}

// Helper to calculate the actual min/max range needed to fit all employees
function calculateDisplayRange(
  employees: EmployeeBenchmarkData[],
  p25: number,
  p75: number
): { min: number; max: number } {
  const compensations = employees.map(e => e.totalCompensation);
  const minComp = Math.min(...compensations);
  const maxComp = Math.max(...compensations);

  // Extend the range to include all employees with some padding
  const rangeSpan = p75 - p25;
  const paddingPercent = 0.1; // 10% padding on each side

  // Use the wider of: benchmark range or actual employee range
  const displayMin = Math.min(p25, minComp) - (rangeSpan * paddingPercent);
  const displayMax = Math.max(p75, maxComp) + (rangeSpan * paddingPercent);

  return { min: displayMin, max: displayMax };
}

// Helper to calculate position along the display range (0-100%)
function calculatePosition(
  compensation: number,
  displayMin: number,
  displayMax: number
): number {
  // Position relative to the display range
  // 0% = displayMin, 100% = displayMax
  const position = ((compensation - displayMin) / (displayMax - displayMin)) * 100;

  // Clamp to ensure it stays within bounds
  return Math.max(0, Math.min(100, position));
}

export default function EmployeeBenchmarkRangeView({
  datasetId,
  currency,
}: EmployeeBenchmarkRangeViewProps) {
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
            <p className="text-sm text-gray-600">Loading benchmark ranges...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!benchmarkData) {
    return null;
  }

  // Group employees by role family (team) and level
  const teamGroups: Record<string, Record<string, EmployeeBenchmarkData[]>> = {};

  benchmarkData.employees.forEach((employee) => {
    const team = extractRoleFamily(employee.role);
    const level = employee.level;

    if (!teamGroups[team]) {
      teamGroups[team] = {};
    }

    if (!teamGroups[team][level]) {
      teamGroups[team][level] = [];
    }

    teamGroups[team][level].push(employee);
  });

  // Level order for sorting
  const levelOrder: Record<string, number> = {
    'C_LEVEL': 1,
    'VP': 2,
    'DIRECTOR': 3,
    'MANAGER': 4,
    'IC': 5,
    'Not Set': 99,
  };

  // Sort teams alphabetically, but put "Tech Team" first
  const sortedTeams = Object.keys(teamGroups).sort((a, b) => {
    if (a === 'Tech Team') return -1;
    if (b === 'Tech Team') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8">
      {sortedTeams.map((team) => {
        const levels = teamGroups[team];
        const sortedLevels = Object.keys(levels).sort(
          (a, b) => (levelOrder[a] || 99) - (levelOrder[b] || 99)
        );

        // Skip teams with no benchmarked employees
        const hasBenchmarks = sortedLevels.some((level) =>
          levels[level].some((emp) => emp.benchmark)
        );

        if (!hasBenchmarks) return null;

        return (
          <div key={team} className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{team}</h3>

            <div className="space-y-8">
              {sortedLevels.map((level) => {
                const employees = levels[level];

                // Get benchmark data from first employee with benchmark
                const employeeWithBenchmark = employees.find((e) => e.benchmark);
                if (!employeeWithBenchmark?.benchmark) return null;

                const { p25, p50, p75, currency: benchCurrency } = employeeWithBenchmark.benchmark;

                // Calculate the display range that fits all employees
                const displayRange = calculateDisplayRange(employees, p25, p75);
                const { min: displayMin, max: displayMax } = displayRange;

                // Calculate where p25, p50, p75 fall within the display range
                const p25Position = calculatePosition(p25, displayMin, displayMax);
                const p50Position = calculatePosition(p50, displayMin, displayMax);
                const p75Position = calculatePosition(p75, displayMin, displayMax);

                return (
                  <div key={level} className="relative">
                    {/* Level label */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-lg font-semibold text-gray-900 w-24">
                        {formatLevelName(level)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {employees.length} {employees.length === 1 ? 'employee' : 'employees'}
                      </div>
                    </div>

                    {/* Benchmark range visualization */}
                    <div className="relative h-16 flex items-center px-[5%]">
                      {/* Gray line extending full width */}
                      <div className="absolute inset-x-[5%] h-0.5 bg-gray-200" style={{ top: '50%' }}></div>

                      {/* Blue benchmark range box (p25 to p75) - positioned dynamically */}
                      <div className="relative w-full flex items-center">
                        <div
                          className="absolute h-12 bg-blue-50 border-2 border-blue-400 rounded-lg"
                          style={{
                            left: `${p25Position}%`,
                            width: `${p75Position - p25Position}%`,
                          }}
                        >
                          {/* Median line (p50) */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-blue-600"
                            style={{
                              left: `${((p50Position - p25Position) / (p75Position - p25Position)) * 100}%`,
                            }}
                          ></div>
                        </div>

                        {/* Position employees along the range */}
                        {employees.map((employee, index) => {
                          // For employees without benchmarks, still show them using the level's benchmark range
                          const hasBenchmark = employee.benchmark !== null;

                          // Calculate position within the display range (0-100%)
                          const position = calculatePosition(
                            employee.totalCompensation,
                            displayMin,
                            displayMax
                          );

                          // Position is already 0-100% of the full width
                          const leftPercent = position;

                          let targetColor = 'text-green-600';
                          let bgColor = 'bg-green-100';

                          if (!hasBenchmark) {
                            // Gray for employees without benchmark match
                            targetColor = 'text-gray-400';
                            bgColor = 'bg-gray-100';
                          } else if (employee.marketPosition) {
                            if (employee.marketPosition.status === 'above') {
                              targetColor = 'text-orange-500';
                              bgColor = 'bg-orange-100';
                            } else if (employee.marketPosition.status === 'below') {
                              targetColor = 'text-red-500';
                              bgColor = 'bg-red-100';
                            }
                          }

                          // Add slight vertical offset to prevent overlapping when employees are close
                          const verticalOffset = (index % 3) * 8 - 8; // -8, 0, or 8 pixels

                          return (
                            <div
                              key={employee.id}
                              className="absolute group cursor-pointer"
                              style={{
                                left: `${leftPercent}%`,
                                top: `calc(50% + ${verticalOffset}px)`,
                                transform: 'translate(-50%, -50%)',
                                zIndex: 10,
                              }}
                            >
                              {/* Target icon */}
                              <div className={`${bgColor} rounded-full p-1.5 border-2 border-white shadow-md hover:scale-110 transition-transform hover:z-20`}>
                                {hasBenchmark ? (
                                  <Target className={`w-5 h-5 ${targetColor}`} />
                                ) : (
                                  <AlertCircle className={`w-5 h-5 ${targetColor}`} />
                                )}
                              </div>

                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                  <div className="font-semibold">{employee.name}</div>
                                  <div className="text-gray-300">{employee.role}</div>
                                  <div className="mt-1 font-semibold">
                                    {currency} {(employee.totalCompensation / 1000).toFixed(0)}k
                                  </div>
                                  {hasBenchmark && employee.marketPosition ? (
                                    <div className={`mt-1 ${
                                      employee.marketPosition.status === 'above' ? 'text-orange-400' :
                                      employee.marketPosition.status === 'below' ? 'text-red-400' :
                                      'text-green-400'
                                    }`}>
                                      {employee.marketPosition.percentDiff >= 0 ? '+' : ''}
                                      {employee.marketPosition.percentDiff}% vs market
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-gray-400 text-xs">
                                      No benchmark match
                                    </div>
                                  )}
                                  {/* Arrow pointer */}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                                    <div className="border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Range labels */}
                    <div className="relative mt-2 px-[5%] pb-8">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <div className="text-left">
                          {currency} {(displayMin / 1000).toFixed(0)}k
                        </div>
                        <div className="text-right">
                          {currency} {(displayMax / 1000).toFixed(0)}k
                        </div>
                      </div>
                      {/* Benchmark range labels (p25, p50, p75) */}
                      <div className="relative h-10">
                        <div
                          className="absolute text-xs whitespace-nowrap"
                          style={{ left: `${p25Position}%`, transform: 'translateX(-50%)' }}
                        >
                          <div className="font-medium text-blue-600">p25</div>
                          <div className="text-gray-600">{currency} {(p25 / 1000).toFixed(0)}k</div>
                        </div>
                        <div
                          className="absolute text-xs text-center whitespace-nowrap"
                          style={{ left: `${p50Position}%`, transform: 'translateX(-50%)' }}
                        >
                          <div className="font-medium text-blue-700">p50 (Median)</div>
                          <div className="text-gray-700">{currency} {(p50 / 1000).toFixed(0)}k</div>
                        </div>
                        <div
                          className="absolute text-xs text-right whitespace-nowrap"
                          style={{ left: `${p75Position}%`, transform: 'translateX(-50%)' }}
                        >
                          <div className="font-medium text-blue-600">p75</div>
                          <div className="text-gray-600">{currency} {(p75 / 1000).toFixed(0)}k</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Legend</h4>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 rounded-full p-1 border-2 border-white shadow-sm">
              <Target className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-gray-700">Above market (&gt;5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-green-100 rounded-full p-1 border-2 border-white shadow-sm">
              <Target className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-gray-700">On market (±5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-red-100 rounded-full p-1 border-2 border-white shadow-sm">
              <Target className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-gray-700">Below market (&lt;-5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 rounded-full p-1 border-2 border-white shadow-sm">
              <AlertCircle className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-gray-700">No benchmark data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 bg-blue-50 border-2 border-blue-400 rounded"></div>
            <span className="text-gray-700">Market range (p25-p75)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
