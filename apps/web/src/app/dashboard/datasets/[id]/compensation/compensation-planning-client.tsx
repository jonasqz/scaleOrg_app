'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Info, TrendingUp, Calendar, Edit2, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
  id: string;
  employeeName: string | null;
  role: string | null;
  level: string | null;
  department: string;
  location: string | null;
  totalCompensation: number;
  annualSalary: number | null;
  bonus: number | null;
  equityValue: number | null;
  fteFactor: number;
  compensationTargets: CompensationTarget[];
  monthlyPlannedCompensation: MonthlyPlannedCompensation[];
}

interface CompensationTarget {
  id: string;
  employeeId: string;
  scenarioId: string | null;
  targetAnnualComp: number;
  calculationMethod: string;
  benchmarkSource: string | null;
  isManualOverride: boolean;
  overrideReason: string | null;
  explanation: any;
  targetDate: Date | null;
}

interface MonthlyPlannedCompensation {
  id: string;
  employeeId: string;
  period: Date;
  plannedGrossTotal: number;
  plannedTotalEmployerCost: number;
  isManualOverride: boolean;
}

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  status: string;
  isBaseline: boolean;
  targets: CompensationTarget[];
}

interface CompensationPlanningClientProps {
  datasetId: string;
  currency: string;
  employees: Employee[];
  scenarios: Scenario[];
  baselineScenarioId: string;
}

export default function CompensationPlanningClient({
  datasetId,
  currency,
  employees,
  scenarios,
  baselineScenarioId,
}: CompensationPlanningClientProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(baselineScenarioId);
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [showExplanation, setShowExplanation] = useState<{
    employeeId: string;
    target: CompensationTarget;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);

  // Get unique values for filters
  const teams = useMemo(
    () => Array.from(new Set(employees.map(e => e.department))).sort(),
    [employees]
  );
  const roles = useMemo(
    () =>
      Array.from(new Set(employees.map(e => e.role).filter(Boolean) as string[])).sort(),
    [employees]
  );
  const locations = useMemo(
    () =>
      Array.from(new Set(employees.map(e => e.location).filter(Boolean) as string[])).sort(),
    [employees]
  );

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (teamFilter !== 'all' && emp.department !== teamFilter) return false;
      if (roleFilter !== 'all' && emp.role !== roleFilter) return false;
      if (locationFilter !== 'all' && emp.location !== locationFilter) return false;
      return true;
    });
  }, [employees, teamFilter, roleFilter, locationFilter]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const currentTotal = filteredEmployees.reduce((sum, emp) => sum + emp.totalCompensation, 0);

    // Get SHOULD targets for selected scenario
    const targetTotal = filteredEmployees.reduce((sum, emp) => {
      const target = emp.compensationTargets.find(t => t.scenarioId === selectedScenarioId);
      return sum + (target?.targetAnnualComp || emp.totalCompensation);
    }, 0);

    // Calculate FORECAST total (next 12 months from monthly planned comp)
    const now = new Date();
    const next12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const forecastTotal = filteredEmployees.reduce((sum, emp) => {
      // Sum up next 12 months
      const monthlyTotal = emp.monthlyPlannedCompensation
        .filter(mpc => {
          const periodStr = `${mpc.period.getFullYear()}-${String(mpc.period.getMonth() + 1).padStart(2, '0')}`;
          return next12Months.includes(periodStr);
        })
        .reduce((mSum, mpc) => mSum + mpc.plannedGrossTotal, 0);
      return sum + monthlyTotal;
    }, 0);

    const delta = forecastTotal - currentTotal;
    const deltaPercent = currentTotal > 0 ? (delta / currentTotal) * 100 : 0;
    const gap = targetTotal - forecastTotal;
    const gapPercent = targetTotal > 0 ? (forecastTotal / targetTotal) * 100 : 0;

    return {
      current: {
        total: currentTotal,
        monthly: currentTotal / 12,
      },
      target: {
        total: targetTotal,
        monthly: targetTotal / 12,
      },
      forecast: {
        total: forecastTotal,
        monthly: forecastTotal / 12,
      },
      delta: {
        amount: delta,
        percent: deltaPercent,
      },
      gap: {
        amount: gap,
        percent: gapPercent,
      },
    };
  }, [filteredEmployees, selectedScenarioId]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${currency}${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${currency}${(value / 1000).toFixed(0)}k`;
    }
    return `${currency}${value.toFixed(0)}`;
  };

  const formatCurrencyFull = (value: number) => {
    return `${currency}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const toggleEmployee = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const handleAutoCalculate = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch(`/api/datasets/${datasetId}/compensation/auto-calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: selectedScenarioId,
          targetPercentile: 'p50', // Use median by default
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Targets calculated successfully', {
          description: `Calculated targets for ${data.targetsCreated} employees based on market benchmarks`,
        });
        // Reload the page to show updated data
        window.location.reload();
      } else {
        toast.error('Failed to calculate targets', {
          description: 'Could not calculate compensation targets. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error calculating targets:', error);
      toast.error('Failed to calculate targets', {
        description: 'An error occurred while calculating targets. Please try again.',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Get forecast date for an employee (when they'll reach target)
  const getForecastDate = (employee: Employee, target: CompensationTarget | undefined) => {
    if (!target) return null;

    // If there's a targetDate set, use that
    if (target.targetDate) {
      return new Date(target.targetDate);
    }

    // Otherwise, calculate based on monthly adjustments
    const now = new Date();
    const future = new Date(now);
    future.setMonth(future.getMonth() + 12); // Default to 12 months from now
    return future;
  };

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="grid gap-4 md:grid-cols-5">
        {/* Current Payroll */}
        <div className="rounded-lg border border-stone-300 bg-stone-50 p-4">
          <div className="text-[10px] font-medium text-stone-600 uppercase tracking-wide">Current Payroll</div>
          <div className="mt-2 text-xl font-bold text-stone-900">
            {formatCurrencyFull(summaryMetrics.current.total)}
          </div>
          <div className="mt-0.5 text-[10px] text-stone-600">
            {formatCurrencyFull(summaryMetrics.current.monthly)}/mo
          </div>
        </div>

        {/* Target Payroll */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="text-[10px] font-medium text-amber-700 uppercase tracking-wide">Target Payroll</div>
          <div className="mt-2 text-xl font-bold text-amber-700">
            {formatCurrencyFull(summaryMetrics.target.total)}
          </div>
          <div className="mt-0.5 text-[10px] text-amber-600">
            {formatCurrencyFull(summaryMetrics.target.monthly)}/mo
          </div>
        </div>

        {/* Forecasted Payroll */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="text-[10px] font-medium text-blue-700 uppercase tracking-wide">Forecasted Payroll</div>
          <div className="mt-2 text-xl font-bold text-blue-700">
            {formatCurrencyFull(summaryMetrics.forecast.total)}
          </div>
          <div className="mt-0.5 text-[10px] text-blue-600">
            {formatCurrencyFull(summaryMetrics.forecast.monthly)}/mo
          </div>
        </div>

        {/* Delta vs Current */}
        <div className={`rounded-lg border p-4 ${
          summaryMetrics.delta.amount >= 0
            ? 'border-red-200 bg-red-50'
            : 'border-green-200 bg-green-50'
        }`}>
          <div className={`text-[10px] font-medium uppercase tracking-wide ${
            summaryMetrics.delta.amount >= 0 ? 'text-red-700' : 'text-green-700'
          }`}>
            Delta vs Current
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className={`text-xl font-bold ${
              summaryMetrics.delta.amount >= 0 ? 'text-red-700' : 'text-green-700'
            }`}>
              {summaryMetrics.delta.amount >= 0 ? '+' : ''}
              {formatCurrencyFull(summaryMetrics.delta.amount)}
            </div>
            {summaryMetrics.delta.amount > 0 && (
              <TrendingUp className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className={`mt-0.5 text-[10px] font-semibold ${
            summaryMetrics.delta.amount >= 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {summaryMetrics.delta.percent >= 0 ? '+' : ''}
            {summaryMetrics.delta.percent.toFixed(1)}%
          </div>
        </div>

        {/* Gap to Target */}
        <div className={`rounded-lg border p-4 ${
          summaryMetrics.gap.percent >= 95
            ? 'border-green-200 bg-green-50'
            : summaryMetrics.gap.percent >= 80
            ? 'border-amber-200 bg-amber-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <div className={`text-[10px] font-medium uppercase tracking-wide ${
            summaryMetrics.gap.percent >= 95
              ? 'text-green-700'
              : summaryMetrics.gap.percent >= 80
              ? 'text-amber-700'
              : 'text-red-700'
          }`}>
            Gap to Target
          </div>
          <div className={`mt-2 text-xl font-bold ${
            summaryMetrics.gap.percent >= 95
              ? 'text-green-700'
              : summaryMetrics.gap.percent >= 80
              ? 'text-amber-700'
              : 'text-red-700'
          }`}>
            {formatCurrencyFull(Math.abs(summaryMetrics.gap.amount))}
          </div>
          <div className={`mt-0.5 text-[10px] ${
            summaryMetrics.gap.percent >= 95
              ? 'text-green-600'
              : summaryMetrics.gap.percent >= 80
              ? 'text-amber-600'
              : 'text-red-600'
          }`}>
            {summaryMetrics.gap.percent.toFixed(1)}% of target
          </div>
        </div>
      </div>

      {/* Filters and Scenario Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-stone-700">Filters:</span>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="max-w-[160px] rounded-md border border-stone-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="all">All Teams</option>
            {teams.map(team => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="max-w-[180px] rounded-md border border-stone-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="max-w-[160px] rounded-md border border-stone-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Scenario Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-stone-700">Scenario:</span>
          <select
            value={selectedScenarioId}
            onChange={e => setSelectedScenarioId(e.target.value)}
            className="max-w-[180px] rounded-md border border-stone-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
          {selectedScenario && selectedScenario.status !== 'APPROVED' && (
            <span className="whitespace-nowrap rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-800">
              Not approved
            </span>
          )}
          <button
            onClick={handleAutoCalculate}
            disabled={isCalculating}
            className="whitespace-nowrap inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            <Calculator className="h-3.5 w-3.5" />
            {isCalculating ? 'Calculating...' : 'Auto-Calculate'}
          </button>
        </div>
      </div>

      {/* Employee Table */}
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-stone-600">
                  Employee
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-stone-600">
                  Level & Team
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-stone-600">
                  Location
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-600">
                  IS<br />
                  <span className="font-normal text-stone-400">Current</span>
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-600">
                  SHOULD<br />
                  <span className="font-normal text-stone-400">Target</span>
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-600">
                  Gap
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-600">
                  FORECAST<br />
                  <span className="font-normal text-stone-400">Planned</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {filteredEmployees.map(employee => {
                const target = employee.compensationTargets.find(
                  t => t.scenarioId === selectedScenarioId
                );
                const targetComp = target?.targetAnnualComp || employee.totalCompensation;
                const gap = targetComp - employee.totalCompensation;
                const gapPercent =
                  employee.totalCompensation > 0
                    ? (gap / employee.totalCompensation) * 100
                    : 0;
                const forecastDate = getForecastDate(employee, target);

                const isExpanded = expandedEmployees.has(employee.id);

                return (
                  <>
                    {/* Main Employee Row */}
                    <tr key={employee.id} className="hover:bg-stone-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleEmployee(employee.id)}
                            className="text-stone-400 hover:text-stone-600"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <div>
                            <div className="text-xs font-medium text-stone-900">
                              {employee.employeeName}
                            </div>
                            {employee.role && (
                              <div className="text-[10px] text-stone-500">{employee.role}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-stone-900">
                        {employee.level && (
                          <div className="text-[10px] font-medium">{employee.level}</div>
                        )}
                        <div className="text-[10px] text-stone-500">{employee.department}</div>
                      </td>
                      <td className="px-3 py-2 text-[10px] text-stone-500">
                        {employee.location || '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium text-stone-900">
                        {formatCurrencyFull(employee.totalCompensation)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs font-medium text-orange-600">
                            {formatCurrencyFull(targetComp)}
                          </span>
                          {target && (
                            <button
                              onClick={() => setShowExplanation({ employeeId: employee.id, target })}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Info className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div
                          className={`text-xs font-medium ${
                            gap > 0 ? 'text-red-600' : gap < 0 ? 'text-green-600' : 'text-stone-900'
                          }`}
                        >
                          {gap >= 0 ? '+' : ''}
                          {formatCurrencyFull(gap)}
                        </div>
                        <div
                          className={`text-[10px] ${
                            gap > 0 ? 'text-red-600' : gap < 0 ? 'text-green-600' : 'text-stone-500'
                          }`}
                        >
                          {gapPercent >= 0 ? '+' : ''}
                          {gapPercent.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-xs font-medium text-orange-700">
                          {formatCurrencyFull(targetComp)}
                        </div>
                        {forecastDate && (
                          <div className="text-[10px] text-stone-500">
                            {forecastDate.toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Monthly Breakdown */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-stone-50 px-4 py-3">
                          <div className="text-xs font-medium text-stone-700 mb-2">
                            Monthly Breakdown (Next 12 Months)
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {employee.monthlyPlannedCompensation.slice(0, 12).map(mpc => {
                              return (
                                <div
                                  key={mpc.id}
                                  className="rounded border border-stone-200 bg-white p-2"
                                >
                                  <div className="text-[10px] font-medium text-stone-500">
                                    {mpc.period.toLocaleDateString('en-US', {
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </div>
                                  <div className="mt-1 text-xs font-semibold text-stone-900">
                                    {formatCurrency(mpc.plannedGrossTotal)}
                                  </div>
                                  {mpc.isManualOverride && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-green-600">
                                      <Edit2 className="h-3 w-3" />
                                      Edited
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanation Panel */}
      {showExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-2xl w-full rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-900">
                Target Compensation Explanation
              </h3>
              <button
                onClick={() => setShowExplanation(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-xs text-stone-600">Target Annual Compensation:</span>
                <span className="text-xs font-semibold text-stone-900">
                  {formatCurrencyFull(showExplanation.target.targetAnnualComp)}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-xs text-stone-600">Calculation Method:</span>
                <span className="text-xs text-stone-900">
                  {showExplanation.target.calculationMethod}
                </span>
              </div>
              {showExplanation.target.benchmarkSource && (
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-xs text-stone-600">Benchmark Source:</span>
                  <span className="text-xs text-stone-900">
                    {showExplanation.target.benchmarkSource}
                  </span>
                </div>
              )}
              {showExplanation.target.isManualOverride && (
                <div className="rounded border border-yellow-200 bg-yellow-50 p-2.5">
                  <div className="text-xs font-medium text-yellow-800">Manual Override</div>
                  {showExplanation.target.overrideReason && (
                    <div className="mt-1 text-xs text-yellow-700">
                      {showExplanation.target.overrideReason}
                    </div>
                  )}
                </div>
              )}
              {showExplanation.target.explanation && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-stone-700 mb-2">
                    Calculation Breakdown:
                  </div>
                  <pre className="rounded border border-stone-200 bg-stone-50 p-2.5 text-[10px] text-stone-900 overflow-x-auto">
                    {JSON.stringify(showExplanation.target.explanation, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowExplanation(null)}
                className="rounded-md bg-orange-600 px-4 py-2 text-xs text-white hover:bg-orange-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
