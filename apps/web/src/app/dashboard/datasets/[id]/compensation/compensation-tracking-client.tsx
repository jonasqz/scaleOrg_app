'use client';

import { useEffect, useState, useRef } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronRight, Edit2, Check, X } from 'lucide-react';
import CompensationSetupWizard from './compensation-setup-wizard';

interface CompensationTrackingClientProps {
  datasetId: string;
  currency: string;
  currentCashBalance: number | null;
  employees: any[];
  departmentCategories?: Record<string, string>;
}

interface MonthData {
  month: string;
  label: string;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  planned: number;
  actual: number | null;
  variance: number | null;
  variancePercent: number | null;
  revenue: number | null;
}

interface EmployeeMonthData {
  month: string;
  label: string;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  planned: {
    grossTotal: number;
    totalEmployerCost: number;
    isManualOverride: boolean;
  };
  actual: {
    grossTotal: number | null;
    totalEmployerCost: number | null;
  };
  variance: {
    amount: number | null;
    percent: number | null;
  };
}

interface EmployeeData {
  employeeId: string;
  employeeName: string;
  department: string;
  monthlyData: EmployeeMonthData[];
}

interface DepartmentData {
  department: string;
  employees: EmployeeData[];
  monthlyTotals: {
    month: string;
    label: string;
    planned: number;
    actual: number | null;
    variance: number | null;
    variancePercent: number | null;
  }[];
}

export default function CompensationTrackingClient({
  datasetId,
  currency,
  currentCashBalance,
  employees,
  departmentCategories,
}: CompensationTrackingClientProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthData[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [months, setMonths] = useState<any[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    employeeId: string;
    month: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if this is first time setup (no cash balance and no historical data)
    const checkFirstTimeSetup = async () => {
      try {
        const response = await fetch(`/api/datasets/${datasetId}/compensation/planning`);
        if (response.ok) {
          const data = await response.json();
          // Show wizard if no departments (empty data) and no cash balance
          if (data.departments.length === 0 && !currentCashBalance) {
            setShowWizard(true);
            setLoading(false);
          } else {
            fetchData();
          }
        } else {
          fetchData();
        }
      } catch {
        fetchData();
      }
    };

    checkFirstTimeSetup();
  }, [datasetId]);

  useEffect(() => {
    // Scroll to current month on load
    if (scrollContainerRef.current && months.length > 0) {
      const currentMonthIndex = months.findIndex((m: any) => {
        const monthData = monthlySummary.find(ms => ms.month === m.period);
        return monthData?.isCurrent;
      });
      if (currentMonthIndex >= 0) {
        const scrollPosition = currentMonthIndex * 120; // Approximate column width
        scrollContainerRef.current.scrollLeft = Math.max(0, scrollPosition - 200);
      }
    }
  }, [months, monthlySummary]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/datasets/${datasetId}/compensation/planning`);
      if (response.ok) {
        const data = await response.json();
        console.log('Compensation data received:', data);
        setDepartments(data.departments || []);
        setMonthlySummary(data.monthlySummary || []);
        setSummary(data.summary || null);
        setMonths(data.months || []);
        // Expand first department by default
        if (data.departments && data.departments.length > 0) {
          setExpandedDepartments(new Set([data.departments[0].department]));
        }
      } else {
        console.error('Failed to fetch compensation data:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Failed to fetch compensation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (dept: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(dept)) {
      newExpanded.delete(dept);
    } else {
      newExpanded.add(dept);
    }
    setExpandedDepartments(newExpanded);
  };

  const startEdit = (employeeId: string, month: string, currentValue: number) => {
    setEditingCell({ employeeId, month });
    setEditValue(currentValue.toFixed(0));
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    const newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue < 0) {
      alert('Please enter a valid positive number');
      return;
    }

    try {
      const response = await fetch(`/api/datasets/${datasetId}/compensation/planning`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: editingCell.employeeId,
          period: editingCell.month,
          plannedTotalEmployerCost: newValue,
        }),
      });

      if (response.ok) {
        // Refresh data
        await fetchData();
        cancelEdit();
      } else {
        alert('Failed to update planned value');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to update planned value');
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    if (value >= 1000000) {
      return `${currency} ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${currency} ${(value / 1000).toFixed(0)}k`;
    }
    return `${currency} ${value.toFixed(0)}`;
  };

  const getVarianceColor = (percent: number | null) => {
    if (percent === null) return 'text-gray-400';
    if (percent > 10) return 'text-red-600';
    if (percent > 5) return 'text-orange-600';
    if (percent > -5) return 'text-green-600';
    return 'text-blue-600';
  };

  const getVarianceBackground = (percent: number | null) => {
    if (percent === null) return 'bg-gray-50';
    if (percent > 10) return 'bg-red-50';
    if (percent > 5) return 'bg-orange-50';
    if (percent > -5) return 'bg-green-50';
    return 'bg-blue-50';
  };

  // Show wizard for first-time setup
  if (showWizard) {
    return (
      <CompensationSetupWizard
        datasetId={datasetId}
        currency={currency}
        onComplete={() => {
          setShowWizard(false);
          fetchData();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading compensation data...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!loading && departments.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No employee data found</h3>
        <p className="mt-2 text-sm text-gray-600">
          Add employees to your dataset to see compensation planning
        </p>
        <button
          onClick={() => setShowWizard(true)}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Run Setup Wizard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Burn Rate */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-red-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(summary?.currentMonthBurn || 0)}
          </p>
          <p className="text-sm text-gray-600">Current Month Burn</p>
          <p className="mt-1 text-xs text-gray-500">
            Avg: {formatCurrency(summary?.avgMonthlyBurn || 0)}/mo
          </p>
        </div>

        {/* Variance */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            {summary && summary.avgVariancePercent > 0 ? (
              <TrendingUp className="h-8 w-8 text-orange-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-green-600" />
            )}
          </div>
          <p className={`mt-4 text-2xl font-bold ${getVarianceColor(summary?.avgVariancePercent)}`}>
            {summary && summary.avgVariancePercent !== null && summary.avgVariancePercent !== undefined
              ? `${summary.avgVariancePercent > 0 ? '+' : ''}${summary.avgVariancePercent.toFixed(1)}%`
              : 'N/A'}
          </p>
          <p className="text-sm text-gray-600">Avg Variance (Plan vs Actual)</p>
          <p className="mt-1 text-xs text-gray-500">
            Total: {formatCurrency(summary?.totalVariance || 0)}
          </p>
        </div>

        {/* Runway */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {summary && summary.runway !== null && summary.runway !== undefined
              ? `${summary.runway.toFixed(1)} mo`
              : 'N/A'}
          </p>
          <p className="text-sm text-gray-600">Runway</p>
          {currentCashBalance === null && (
            <p className="mt-1 text-xs text-yellow-600">
              Set cash balance in settings
            </p>
          )}
          {currentCashBalance !== null && (
            <p className="mt-1 text-xs text-gray-500">
              Cash: {formatCurrency(currentCashBalance)}
            </p>
          )}
        </div>

        {/* Active Employees */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {summary?.employeeCount || 0}
          </p>
          <p className="text-sm text-gray-600">Active Employees</p>
          <p className="mt-1 text-xs text-gray-500">
            {departments.length} departments
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Planned vs Actual by Department
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Click department to expand • Click planned values to edit • Past months show actual vs planned
          </p>
        </div>

        {/* Scrollable table container */}
        <div className="overflow-x-auto" ref={scrollContainerRef}>
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Department / Employee
                  </th>
                  {months.map((month: any, idx: number) => {
                    const monthData = monthlySummary.find(m => m.month === month.period);
                    const isCurrent = monthData?.isCurrent;
                    return (
                      <th
                        key={month.period}
                        className={`px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                          isCurrent ? 'bg-blue-100' : ''
                        }`}
                      >
                        {month.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((dept) => (
                  <>
                    {/* Department Row */}
                    <tr
                      key={dept.department}
                      className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      onClick={() => toggleDepartment(dept.department)}
                    >
                      <td className="sticky left-0 z-10 bg-gray-50 hover:bg-gray-100 px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {expandedDepartments.has(dept.department) ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="text-sm font-semibold text-gray-900">
                            {dept.department}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({dept.employees.length})
                          </span>
                        </div>
                      </td>
                      {dept.monthlyTotals.map((monthTotal) => {
                        const monthInfo = monthlySummary.find(m => m.month === monthTotal.month);
                        const isCurrent = monthInfo?.isCurrent;
                        const isPast = monthInfo?.isPast;
                        const isFuture = monthInfo?.isFuture;
                        return (
                          <td
                            key={monthTotal.month}
                            className={`px-3 py-3 whitespace-nowrap text-center ${
                              isCurrent ? 'bg-blue-50' : ''
                            } ${getVarianceBackground(monthTotal.variancePercent)}`}
                          >
                            <div className="text-xs">
                              {/* Planned / Actual values */}
                              <div className="font-semibold text-gray-900 flex items-center gap-1 justify-center">
                                <span>{formatCurrency(monthTotal.planned)}</span>
                                <span className="text-gray-400">/</span>
                                <span className={monthTotal.actual !== null ? 'text-gray-900' : 'text-gray-400'}>
                                  {formatCurrency(monthTotal.actual)}
                                </span>
                              </div>

                              {/* Status badge below */}
                              {isPast && monthTotal.actual !== null && monthTotal.variancePercent !== null ? (
                                <div className={`text-xs ${getVarianceColor(monthTotal.variancePercent)}`}>
                                  {`${monthTotal.variancePercent > 0 ? '+' : ''}${monthTotal.variancePercent.toFixed(1)}%`}
                                </div>
                              ) : isPast ? (
                                <div className="text-xs text-yellow-600">Pending</div>
                              ) : isFuture ? (
                                <div className="text-xs text-blue-600">Forecast</div>
                              ) : (
                                <div className="text-xs text-purple-600">Current</div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Employee Rows (expanded) */}
                    {expandedDepartments.has(dept.department) &&
                      dept.employees.map((employee) => (
                        <tr key={employee.employeeId} className="hover:bg-gray-50">
                          <td className="sticky left-0 z-10 bg-white hover:bg-gray-50 px-4 py-2 pl-12 whitespace-nowrap">
                            <span className="text-sm text-gray-700">
                              {employee.employeeName}
                            </span>
                          </td>
                          {employee.monthlyData.map((monthData) => {
                            const monthInfo = monthlySummary.find(m => m.month === monthData.month);
                            const isCurrent = monthInfo?.isCurrent;
                            const isPast = monthInfo?.isPast;
                            const isFuture = monthInfo?.isFuture;
                            const isEditing =
                              editingCell?.employeeId === employee.employeeId &&
                              editingCell?.month === monthData.month;

                            return (
                              <td
                                key={monthData.month}
                                className={`px-2 py-2 whitespace-nowrap text-center ${
                                  isCurrent ? 'bg-blue-50' : ''
                                } ${getVarianceBackground(monthData.variance.percent)}`}
                              >
                                {isEditing ? (
                                  <div className="flex items-center gap-1 justify-center">
                                    <input
                                      type="number"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEdit();
                                        if (e.key === 'Escape') cancelEdit();
                                      }}
                                      className="w-20 rounded border px-1 py-0.5 text-xs"
                                      autoFocus
                                    />
                                    <button
                                      onClick={saveEdit}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className="text-xs group cursor-pointer"
                                    onClick={() =>
                                      !isPast &&
                                      startEdit(
                                        employee.employeeId,
                                        monthData.month,
                                        monthData.planned.totalEmployerCost
                                      )
                                    }
                                  >
                                    {/* Planned / Actual values */}
                                    <div className="font-medium text-gray-900 flex items-center gap-1 justify-center">
                                      <span>{formatCurrency(monthData.planned.totalEmployerCost)}</span>
                                      <span className="text-gray-400">/</span>
                                      <span className={monthData.actual.totalEmployerCost !== null ? 'text-gray-900' : 'text-gray-400'}>
                                        {formatCurrency(monthData.actual.totalEmployerCost)}
                                      </span>
                                      {(isCurrent || isFuture) && (
                                        <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                                      )}
                                    </div>

                                    {/* Status badge below */}
                                    {isPast && monthData.actual.totalEmployerCost !== null ? (
                                      <div className={`text-xs ${getVarianceColor(monthData.variance.percent)}`}>
                                        {monthData.variance.percent !== null
                                          ? `${monthData.variance.percent > 0 ? '+' : ''}${monthData.variance.percent.toFixed(1)}%`
                                          : ''}
                                      </div>
                                    ) : isPast ? (
                                      <div className="text-xs text-yellow-600">Pending</div>
                                    ) : isFuture ? (
                                      <>
                                        <div className="text-xs text-blue-600">Forecast</div>
                                        {monthData.planned.isManualOverride && (
                                          <div className="text-xs text-green-600">✓ Edited</div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="text-xs text-purple-600">Current</div>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
