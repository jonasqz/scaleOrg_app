'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, Calendar, TrendingUp, Edit2, User, Save, X } from 'lucide-react';
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
  startDate: Date | null;
  endDate: Date | null;
  compensationTargets: CompensationTarget[];
  monthlyPlannedCompensation: MonthlyPlannedCompensation[];
}

interface CompensationTarget {
  id: string;
  scenarioId: string | null;
  targetAnnualComp: number;
  calculationMethod: string;
  benchmarkSource: string | null;
  isManualOverride: boolean;
  overrideReason: string | null;
  explanation: any;
  targetDate: Date | null;
  scenario?: any;
}

interface MonthlyPlannedCompensation {
  id: string;
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
}

interface EmployeeCompensationTabProps {
  employee: Employee;
  datasetId: string;
  currency: string;
  scenarios: Scenario[];
}

export default function EmployeeCompensationTab({
  employee,
  datasetId,
  currency,
  scenarios,
}: EmployeeCompensationTabProps) {
  const router = useRouter();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarios.find(s => s.isBaseline)?.id || scenarios[0]?.id || ''
  );
  const [showExplanation, setShowExplanation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -12 = 12 months ago, +12 = 12 months ahead
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    salary: '',
    bonus: '',
    equity: '',
  });

  // Get the selected target
  const selectedTarget = employee.compensationTargets.find(
    t => t.scenarioId === selectedScenarioId
  );

  const targetComp = selectedTarget?.targetAnnualComp || employee.totalCompensation;
  const gap = targetComp - employee.totalCompensation;
  const gapPercent =
    employee.totalCompensation > 0 ? (gap / employee.totalCompensation) * 100 : 0;

  // Calculate FORECAST total (next 12 months, respecting tenure)
  const forecastTotal = useMemo(() => {
    const now = new Date();
    const employeeStartMonth = employee.startDate
      ? new Date(employee.startDate.getFullYear(), employee.startDate.getMonth(), 1)
      : null;
    const employeeEndMonth = employee.endDate
      ? new Date(employee.endDate.getFullYear(), employee.endDate.getMonth(), 1)
      : null;

    const next12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);

      // Check if month is within tenure
      const isBeforeStart = employeeStartMonth && d < employeeStartMonth;
      const isAfterEnd = employeeEndMonth && d > employeeEndMonth;
      const isWithinTenure = !isBeforeStart && !isAfterEnd;

      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        isWithinTenure,
      };
    }).filter(m => m.isWithinTenure);

    return employee.monthlyPlannedCompensation
      .filter(mpc => {
        const periodStr = `${mpc.period.getFullYear()}-${String(mpc.period.getMonth() + 1).padStart(2, '0')}`;
        return next12Months.some(m => m.key === periodStr);
      })
      .reduce((sum, mpc) => sum + mpc.plannedGrossTotal, 0);
  }, [employee.monthlyPlannedCompensation, employee.startDate, employee.endDate]);

  const forecastDate = selectedTarget?.targetDate
    ? new Date(selectedTarget.targetDate)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default to 1 year from now

  const formatCurrency = (value: number) => {
    return `${currency}${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Get months to display based on offset
  const getDisplayMonths = () => {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);

    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);

      // Check if month is within employee tenure
      const employeeStartMonth = employee.startDate
        ? new Date(employee.startDate.getFullYear(), employee.startDate.getMonth(), 1)
        : null;
      const employeeEndMonth = employee.endDate
        ? new Date(employee.endDate.getFullYear(), employee.endDate.getMonth(), 1)
        : null;

      const isBeforeStart = employeeStartMonth && d < employeeStartMonth;
      const isAfterEnd = employeeEndMonth && d > employeeEndMonth;
      const isOutsideTenure = isBeforeStart || isAfterEnd;

      return {
        date: d,
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        isPast: d < new Date(now.getFullYear(), now.getMonth(), 1),
        isCurrent: d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(),
        isFuture: d > new Date(now.getFullYear(), now.getMonth(), 1),
        isBeforeStart,
        isAfterEnd,
        isOutsideTenure,
      };
    });
  };

  const displayMonths = getDisplayMonths();

  const handleEditMonth = (monthKey: string, mpc: MonthlyPlannedCompensation | undefined) => {
    setEditingMonth(monthKey);
    if (mpc) {
      setEditValues({
        salary: (mpc.plannedGrossTotal - (employee.bonus || 0) / 12 - (employee.equityValue || 0) / 12).toFixed(2),
        bonus: ((employee.bonus || 0) / 12).toFixed(2),
        equity: ((employee.equityValue || 0) / 12).toFixed(2),
      });
    } else {
      setEditValues({
        salary: ((employee.annualSalary || 0) / 12).toFixed(2),
        bonus: ((employee.bonus || 0) / 12).toFixed(2),
        equity: ((employee.equityValue || 0) / 12).toFixed(2),
      });
    }
  };

  const handleSaveMonth = async () => {
    if (!editingMonth) return;

    const salary = parseFloat(editValues.salary) || 0;
    const bonus = parseFloat(editValues.bonus) || 0;
    const equity = parseFloat(editValues.equity) || 0;
    const total = salary + bonus + equity;

    try {
      const response = await fetch(
        `/api/datasets/${datasetId}/employees/${employee.id}/compensation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            period: editingMonth,
            plannedGrossSalary: salary,
            plannedGrossBonus: bonus,
            plannedGrossEquity: equity,
            plannedGrossTotal: total,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Compensation updated', {
        description: 'Monthly compensation has been saved',
      });

      setEditingMonth(null);
      router.refresh();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save', {
        description: 'Could not save compensation. Please try again.',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingMonth(null);
    setEditValues({ salary: '', bonus: '', equity: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/datasets/${datasetId}`)}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <User className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">
                {employee.employeeName || 'Unnamed Employee'}
              </h1>
              <p className="text-xs text-stone-500">
                Compensation Planning
              </p>
              {(employee.startDate || employee.endDate) && (
                <div className="mt-1 flex items-center gap-2 text-[10px] text-stone-500">
                  <Calendar className="h-3 w-3" />
                  {employee.startDate && (
                    <span>
                      Started:{' '}
                      {new Date(employee.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  {employee.endDate && (
                    <span className="text-red-600">
                      • Ended:{' '}
                      {new Date(employee.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Scenario Selector */}
          <span className="text-xs font-medium text-stone-700">Scenario:</span>
          <select
            value={selectedScenarioId}
            onChange={e => setSelectedScenarioId(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>

          {/* Edit Mode Toggle */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
            >
              Edit Compensation
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Done Editing
            </button>
          )}
        </div>
      </div>

      {/* IS/SHOULD/FORECAST Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* IS (Current) */}
        <div className="rounded-lg border border-stone-300 bg-stone-50 p-4">
          <div className="text-xs text-stone-600">IS (Current)</div>
          <div className="mt-2 text-xl font-bold text-stone-900">
            {formatCurrency(employee.totalCompensation)}
          </div>
          <div className="mt-2 space-y-1 text-[10px] text-stone-500">
            {employee.annualSalary && (
              <div>Base: {formatCurrency(employee.annualSalary)}</div>
            )}
            {employee.bonus && <div>Bonus: {formatCurrency(employee.bonus)}</div>}
            {employee.equityValue && (
              <div>Equity: {formatCurrency(employee.equityValue)}</div>
            )}
          </div>
        </div>

        {/* SHOULD (Target) */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-amber-700">SHOULD (Target)</div>
            {selectedTarget && (
              <button
                onClick={() => setShowExplanation(true)}
                className="text-amber-600 hover:text-amber-700 transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="mt-2 text-xl font-bold text-amber-700">
            {formatCurrency(targetComp)}
          </div>
          {selectedTarget && (
            <div className="mt-2 text-[10px] text-amber-600">
              {selectedTarget.calculationMethod === 'benchmark' ? (
                <>Calculated from benchmarks</>
              ) : (
                <>Manually set</>
              )}
            </div>
          )}
          {!selectedTarget && (
            <div className="mt-2 text-[10px] text-yellow-600">No target set</div>
          )}
        </div>

        {/* Gap */}
        <div
          className={`rounded-lg border p-4 ${
            gap > 0
              ? 'border-red-200 bg-red-50'
              : gap < 0
              ? 'border-green-200 bg-green-50'
              : 'border-stone-300 bg-stone-50'
          }`}
        >
          <div
            className={`text-xs ${
              gap > 0 ? 'text-red-700' : gap < 0 ? 'text-green-700' : 'text-stone-600'
            }`}
          >
            Gap
          </div>
          <div
            className={`mt-2 text-xl font-bold ${
              gap > 0 ? 'text-red-700' : gap < 0 ? 'text-green-700' : 'text-stone-900'
            }`}
          >
            {gap >= 0 ? '+' : ''}
            {formatCurrency(gap)}
          </div>
          <div
            className={`mt-2 text-xs ${
              gap > 0 ? 'text-red-600' : gap < 0 ? 'text-green-600' : 'text-stone-500'
            }`}
          >
            {gapPercent >= 0 ? '+' : ''}
            {gapPercent.toFixed(1)}%
          </div>
        </div>

        {/* FORECAST */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="text-xs text-blue-700">FORECAST</div>
          <div className="mt-2 text-xl font-bold text-blue-700">
            {formatCurrency(forecastTotal || targetComp)}
          </div>
          <div className="mt-2 text-[10px] text-blue-600">
            Target: {forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Compensation Breakdown */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-900">
            Compensation Breakdown
          </h3>
          {employee.endDate && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-medium text-red-800">
              Employee Terminated
            </span>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <span className="text-xs font-medium text-stone-700">Current Annual Salary</span>
            <span className="text-xs font-semibold text-stone-900">
              {employee.annualSalary ? formatCurrency(employee.annualSalary) : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <span className="text-xs font-medium text-stone-700">Annual Bonus</span>
            <span className="text-xs font-semibold text-stone-900">
              {employee.bonus ? formatCurrency(employee.bonus) : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <span className="text-xs font-medium text-stone-700">Equity Value</span>
            <span className="text-xs font-semibold text-stone-900">
              {employee.equityValue ? formatCurrency(employee.equityValue) : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900">Total Compensation</span>
            <span className="text-xs font-bold text-stone-900">
              {formatCurrency(employee.totalCompensation)}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-900">
            Monthly Compensation Plan
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonthOffset(monthOffset - 12)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors"
            >
              ← Previous 12 Months
            </button>
            <button
              onClick={() => setMonthOffset(0)}
              disabled={monthOffset === 0}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setMonthOffset(monthOffset + 12)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Next 12 Months →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {displayMonths.map(month => {
            const mpc = employee.monthlyPlannedCompensation.find(m => {
              const mpcKey = `${m.period.getFullYear()}-${String(m.period.getMonth() + 1).padStart(2, '0')}`;
              return mpcKey === month.key;
            });

            const isEditingThisMonth = editingMonth === month.key;

            return (
              <div
                key={month.key}
                className={`rounded-lg border p-3 ${
                  month.isOutsideTenure
                    ? 'bg-stone-200 opacity-60 border-stone-300'
                    : month.isPast
                    ? 'bg-stone-100 border-stone-200'
                    : month.isCurrent
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-medium text-stone-500">
                    {month.date.toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  {month.isBeforeStart && (
                    <span className="text-[10px] text-stone-400">Not hired</span>
                  )}
                  {month.isAfterEnd && (
                    <span className="text-[10px] text-red-500">Ended</span>
                  )}
                  {!month.isOutsideTenure && month.isPast && (
                    <span className="text-[10px] text-stone-400">Actual</span>
                  )}
                  {!month.isOutsideTenure && month.isCurrent && (
                    <span className="text-[10px] text-orange-600">Current</span>
                  )}
                  {!month.isOutsideTenure && month.isFuture && (
                    <span className="text-[10px] text-orange-500">Planned</span>
                  )}
                </div>

                {month.isOutsideTenure ? (
                  <div className="mt-1 text-xs font-semibold text-stone-400">
                    {month.isBeforeStart ? 'N/A' : 'Terminated'}
                  </div>
                ) : !isEditingThisMonth ? (
                  <>
                    <div className="mt-1 text-xs font-semibold text-stone-900">
                      {mpc
                        ? formatCurrency(mpc.plannedGrossTotal)
                        : formatCurrency(employee.totalCompensation / 12)}
                    </div>
                    {mpc?.isManualOverride && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-green-600">
                        <Edit2 className="h-3 w-3" />
                        Edited
                      </div>
                    )}
                    {isEditing && !isEditingThisMonth && (
                      <button
                        onClick={() => handleEditMonth(month.key, mpc)}
                        className="mt-2 w-full rounded bg-orange-600 px-2 py-1 text-[10px] text-white hover:bg-orange-700 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </>
                ) : (
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-stone-700">
                        Base Salary
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={editValues.salary}
                        onChange={e => setEditValues({ ...editValues, salary: e.target.value })}
                        className="w-full rounded border border-stone-300 px-2 py-1 text-[10px] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-stone-700">
                        Bonus
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={editValues.bonus}
                        onChange={e => setEditValues({ ...editValues, bonus: e.target.value })}
                        className="w-full rounded border border-stone-300 px-2 py-1 text-[10px] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-stone-700">
                        Equity Value
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={editValues.equity}
                        onChange={e => setEditValues({ ...editValues, equity: e.target.value })}
                        className="w-full rounded border border-stone-300 px-2 py-1 text-[10px] focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div className="pt-1 text-[10px] text-stone-600">
                      <strong>Total:</strong> {currency}
                      {(
                        (parseFloat(editValues.salary) || 0) +
                        (parseFloat(editValues.bonus) || 0) +
                        (parseFloat(editValues.equity) || 0)
                      ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex gap-1 pt-1">
                      <button
                        onClick={handleSaveMonth}
                        className="flex-1 rounded bg-green-600 px-2 py-1.5 text-[10px] font-medium text-white hover:bg-green-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 rounded bg-stone-300 px-2 py-1.5 text-[10px] font-medium text-stone-700 hover:bg-stone-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation Modal */}
      {showExplanation && selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-2xl w-full rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-900">
                Target Compensation Explanation
              </h3>
              <button
                onClick={() => setShowExplanation(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-xs text-stone-600">Target Annual Compensation:</span>
                <span className="text-xs font-semibold text-stone-900">
                  {formatCurrency(selectedTarget.targetAnnualComp)}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-xs text-stone-600">Calculation Method:</span>
                <span className="text-xs text-stone-900">
                  {selectedTarget.calculationMethod}
                </span>
              </div>
              {selectedTarget.benchmarkSource && (
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-xs text-stone-600">Benchmark Source:</span>
                  <span className="text-xs text-stone-900">
                    {selectedTarget.benchmarkSource}
                  </span>
                </div>
              )}
              {selectedTarget.isManualOverride && (
                <div className="rounded-lg bg-yellow-50 p-3">
                  <div className="text-xs font-medium text-yellow-800">Manual Override</div>
                  {selectedTarget.overrideReason && (
                    <div className="mt-1 text-xs text-yellow-700">
                      {selectedTarget.overrideReason}
                    </div>
                  )}
                </div>
              )}
              {selectedTarget.explanation && (
                <div className="mt-4">
                  <div className="text-xs font-medium text-stone-700 mb-2">
                    Calculation Breakdown:
                  </div>
                  <pre className="rounded-lg bg-stone-50 p-3 text-[10px] text-stone-900 overflow-x-auto">
                    {JSON.stringify(selectedTarget.explanation, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowExplanation(false)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-xs text-white hover:bg-orange-700 transition-colors"
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
