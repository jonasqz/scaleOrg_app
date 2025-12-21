'use client';

import { useState } from 'react';
import { X, Play, TrendingUp, TrendingDown, Users, DollarSign, AlertCircle } from 'lucide-react';
import ScenarioResultsEnhanced from './scenario-results-enhanced';

interface Employee {
  id: string;
  employeeName: string | null;
  email: string | null;
  department: string;
  role: string | null;
  level: string | null;
  totalCompensation: number;
  baseSalary: number | null;
  startDate: Date | null;
}

interface ScenarioBuilderProps {
  datasetId: string;
  currency: string;
  currentMetrics: {
    totalFTE: number;
    totalCost: number;
    employeeCount: number;
    rdToGTM: number;
  };
  departments: { [key: string]: { fte: number; cost: number; employeeCount: number } };
  employees: Employee[];
  onViewEmployees?: () => void;
}

interface AffectedEmployee {
  id: string;
  employeeId: string;
  employeeName: string | null;
  department: string;
  role: string | null;
  totalCompensation: number;
  action: 'remove' | 'add';
  effectiveDate: Date | null;
  isNew?: boolean;
}

interface MonthlyBurnRate {
  month: string;
  baselineCost: number;
  scenarioCost: number;
  savings: number;
  effectiveEmployeeCount: number;
}

interface RunwayAnalysis {
  currentCash: number | null;
  baselineRunwayMonths: number | null;
  scenarioRunwayMonths: number | null;
  runwayExtensionMonths: number | null;
  baselineRunoutDate: Date | null;
  scenarioRunoutDate: Date | null;
}

interface YearEndProjection {
  year: number;
  baselineTotal: number;
  scenarioTotal: number;
  totalSavings: number;
  avgMonthlyBurn: number;
}

interface ScenarioResult {
  baseline: {
    totalFTE: number;
    totalCost: number;
    costPerFTE: number;
    employeeCount: number;
  };
  scenario: {
    totalFTE: number;
    totalCost: number;
    costPerFTE: number;
    employeeCount: number;
  };
  delta: {
    fteChange: number;
    costSavings: number;
    costSavingsPct: number;
  };
  affectedEmployees?: AffectedEmployee[];
  monthlyBurnRate?: MonthlyBurnRate[];
  runway?: RunwayAnalysis;
  yearEndProjection?: YearEndProjection;
}

type ScenarioType = 'custom' | 'hiring_freeze' | 'cost_reduction' | 'growth' | 'target_ratio';

export default function ScenarioBuilder({
  datasetId,
  currency,
  currentMetrics,
  departments,
  employees,
  onViewEmployees
}: ScenarioBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scenarioType, setScenarioType] = useState<ScenarioType>('custom');
  const [scenarioName, setScenarioName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);

  // Custom scenario: department adjustments
  const [deptAdjustments, setDeptAdjustments] = useState<{ [key: string]: number }>({});

  // Cost reduction scenario
  const [reductionPct, setReductionPct] = useState(10);
  const [targetDepartments, setTargetDepartments] = useState<string[]>([]);

  // Growth scenario
  const [additionalFTE, setAdditionalFTE] = useState(5);
  const [growthDist, setGrowthDist] = useState<{ [key: string]: number }>({});

  // Target ratio scenario
  const [targetRatio, setTargetRatio] = useState(1.0);

  // Financial planning
  const [currentCash, setCurrentCash] = useState<string>('');
  const [revenueGrowthRate, setRevenueGrowthRate] = useState<number>(0);
  const [includeRevenue, setIncludeRevenue] = useState(false);

  const handleRunScenario = async () => {
    setLoading(true);
    try {
      const payload: any = {
        type: scenarioType,
        name: scenarioName || getDefaultScenarioName(),
        currentCash: currentCash ? parseFloat(currentCash) : undefined,
        includeTimeline: true,
        revenueGrowthRate: includeRevenue ? revenueGrowthRate : undefined,
      };

      if (scenarioType === 'custom') {
        payload.adjustments = deptAdjustments;
      } else if (scenarioType === 'cost_reduction') {
        payload.reductionPct = reductionPct;
        payload.targetDepartments = targetDepartments.length > 0 ? targetDepartments : undefined;
      } else if (scenarioType === 'growth') {
        payload.additionalFTE = additionalFTE;
        payload.distribution = growthDist;
      } else if (scenarioType === 'target_ratio') {
        payload.targetRatio = targetRatio;
      }

      const response = await fetch(`/api/datasets/${datasetId}/scenarios/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to run scenario');

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Scenario error:', error);
      alert('Failed to run scenario');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultScenarioName = () => {
    switch (scenarioType) {
      case 'hiring_freeze': return 'Hiring Freeze';
      case 'cost_reduction': return `${reductionPct}% Cost Reduction`;
      case 'growth': return `Add ${additionalFTE} FTE`;
      case 'target_ratio': return `Target ${targetRatio}:1 R&D:GTM`;
      default: return 'Custom Scenario';
    }
  };

  const handleDeptAdjustment = (dept: string, change: number) => {
    setDeptAdjustments({
      ...deptAdjustments,
      [dept]: (deptAdjustments[dept] || 0) + change,
    });
  };

  const handleSaveScenario = async () => {
    if (!result) return;

    setSaving(true);
    try {
      const payload = {
        name: scenarioName || getDefaultScenarioName(),
        description: null,
        type: scenarioType,
        parameters: {
          adjustments: deptAdjustments,
          reductionPct,
          targetDepartments,
          additionalFTE,
          distribution: growthDist,
          targetRatio,
        },
        operations: {},
        affectedEmployees: result.affectedEmployees,
        monthlyBurnRate: result.monthlyBurnRate,
        runway: result.runway,
        yearEndProjection: result.yearEndProjection,
        currentCash: currentCash ? parseFloat(currentCash) : null,
        baseline: result.baseline,
        scenario: result.scenario,
        delta: result.delta,
      };

      const response = await fetch(`/api/datasets/${datasetId}/scenarios/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save scenario');

      const data = await response.json();
      alert('Scenario saved successfully!');

      // Optionally close or reset
      handleClose();
    } catch (error) {
      console.error('Save scenario error:', error);
      alert('Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
    setScenarioName('');
    setDeptAdjustments({});
    setScenarioType('custom');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-700"
      >
        <Play className="h-3.5 w-3.5" />
        Run Scenario
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-900">Scenario Modeling</h2>
        <button onClick={handleClose} className="text-stone-400 transition-colors hover:text-stone-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Scenario Type Selector */}
          <div>
            <label className="mb-2 block text-xs font-medium text-stone-700">
              Scenario Type
            </label>
            <select
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value as ScenarioType)}
              className="w-full rounded-md border border-stone-200 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="custom">Custom Adjustments</option>
              <option value="hiring_freeze">Hiring Freeze</option>
              <option value="cost_reduction">Cost Reduction</option>
              <option value="growth">Growth / Hiring Plan</option>
              <option value="target_ratio">Target R&D:GTM Ratio</option>
            </select>
          </div>

          {/* Scenario Name */}
          <div>
            <label className="mb-2 block text-xs font-medium text-stone-700">
              Scenario Name (optional)
            </label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder={getDefaultScenarioName()}
              className="w-full rounded-md border border-stone-200 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Current Cash Balance */}
          <div>
            <label className="mb-2 block text-xs font-medium text-stone-700">
              Current Cash Balance (optional - for runway analysis)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-stone-500">{currency}</span>
              <input
                type="number"
                value={currentCash}
                onChange={(e) => setCurrentCash(e.target.value)}
                placeholder="e.g., 2500000"
                className="w-full rounded-md border border-stone-200 px-4 py-2 pl-12 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <p className="mt-1 text-[10px] text-stone-500">
              Enter your current cash balance to see runway projections
            </p>
          </div>

          {/* Revenue Projections */}
          <div className="rounded-lg border border-stone-200 bg-orange-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-xs font-medium text-orange-900">
                Include Revenue Projections
              </label>
              <button
                onClick={() => setIncludeRevenue(!includeRevenue)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeRevenue ? 'bg-orange-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeRevenue ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {includeRevenue && (
              <div>
                <label className="mb-2 block text-xs font-medium text-orange-900">
                  Monthly Revenue Growth Rate: {revenueGrowthRate > 0 ? '+' : ''}{revenueGrowthRate}%
                </label>
                <input
                  type="range"
                  min="-10"
                  max="20"
                  step="1"
                  value={revenueGrowthRate}
                  onChange={(e) => setRevenueGrowthRate(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="mt-1 text-[10px] text-orange-700">
                  Project revenue growth or decline for more accurate runway calculations
                </p>
              </div>
            )}
          </div>

          {/* Custom Adjustments */}
          {scenarioType === 'custom' && (
            <div>
              <label className="mb-3 block text-xs font-medium text-stone-700">
                Adjust Headcount by Department
              </label>
              <div className="space-y-3">
                {Object.entries(departments).map(([dept, data]) => (
                  <div key={dept} className="flex items-center justify-between rounded-lg border border-stone-200 p-4">
                    <div>
                      <p className="font-medium text-stone-900">{dept}</p>
                      <p className="text-xs text-stone-500">
                        Current: {data.employeeCount} employees ({data.fte.toFixed(1)} FTE)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDeptAdjustment(dept, -1)}
                        className="rounded bg-red-100 px-3 py-1 text-red-700 transition-colors hover:bg-red-200"
                      >
                        -1
                      </button>
                      <span className="min-w-[3rem] text-center font-semibold text-stone-900">
                        {deptAdjustments[dept] > 0 && '+'}
                        {deptAdjustments[dept] || 0}
                      </span>
                      <button
                        onClick={() => handleDeptAdjustment(dept, 1)}
                        className="rounded bg-green-100 px-3 py-1 text-green-700 transition-colors hover:bg-green-200"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Reduction */}
          {scenarioType === 'cost_reduction' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-stone-700">
                  Target Cost Reduction: {reductionPct}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={reductionPct}
                  onChange={(e) => setReductionPct(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-stone-500">
                  Estimated savings: {currency} {((currentMetrics.totalCost * reductionPct) / 100 / 1000000).toFixed(2)}M
                </p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-stone-700">
                  Target Departments (optional - leave empty for all)
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(departments).map((dept) => (
                    <button
                      key={dept}
                      onClick={() => {
                        if (targetDepartments.includes(dept)) {
                          setTargetDepartments(targetDepartments.filter((d) => d !== dept));
                        } else {
                          setTargetDepartments([...targetDepartments, dept]);
                        }
                      }}
                      className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                        targetDepartments.includes(dept)
                          ? 'bg-orange-600 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Growth */}
          {scenarioType === 'growth' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-stone-700">
                  Additional FTE to Hire: {additionalFTE}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={additionalFTE}
                  onChange={(e) => setAdditionalFTE(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-3 block text-xs font-medium text-stone-700">
                  Distribution by Department (% of {additionalFTE} FTE)
                </label>
                <div className="space-y-3">
                  {Object.keys(departments).map((dept) => (
                    <div key={dept}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-stone-700">{dept}</span>
                        <span className="text-xs font-semibold text-stone-900">
                          {((growthDist[dept] || 0) * 100).toFixed(0)}% ({Math.round(additionalFTE * (growthDist[dept] || 0))} FTE)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(growthDist[dept] || 0) * 100}
                        onChange={(e) =>
                          setGrowthDist({
                            ...growthDist,
                            [dept]: parseInt(e.target.value) / 100,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  Total: {(Object.values(growthDist).reduce((sum, v) => sum + v, 0) * 100).toFixed(0)}%
                  {Object.values(growthDist).reduce((sum, v) => sum + v, 0) !== 1.0 && (
                    <span className="ml-2 text-orange-600">(should equal 100%)</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Target Ratio */}
          {scenarioType === 'target_ratio' && (
            <div>
              <label className="mb-2 block text-xs font-medium text-stone-700">
                Target R&D to GTM Ratio: {targetRatio.toFixed(2)}:1
              </label>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={targetRatio}
                onChange={(e) => setTargetRatio(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="mt-1 text-xs text-stone-500">
                Current ratio: {currentMetrics.rdToGTM.toFixed(2)}:1
              </p>
            </div>
          )}

          {/* Hiring Freeze - no additional inputs needed */}
          {scenarioType === 'hiring_freeze' && (
            <div className="rounded-lg bg-orange-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-3.5 w-3.5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-900">Hiring Freeze Scenario</p>
                  <p className="mt-1 text-xs text-orange-700">
                    This scenario removes all open roles and shows the impact of not filling any positions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Run Button */}
          <button
            onClick={handleRunScenario}
            disabled={loading}
            className="w-full rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Running Scenario...' : 'Run Scenario'}
          </button>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="rounded-lg bg-orange-50 p-4">
            <h3 className="font-semibold text-orange-900">
              {scenarioName || getDefaultScenarioName()}
            </h3>
            <p className="mt-1 text-xs text-orange-700">Scenario analysis complete</p>
          </div>

          {/* Comparison Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Baseline */}
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="mb-3 text-xs font-semibold text-stone-600">Current (Baseline)</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-stone-500">Total FTE</p>
                  <p className="text-sm font-bold text-stone-900">
                    {result.baseline.totalFTE.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500">Total Cost</p>
                  <p className="text-sm font-bold text-stone-900">
                    {currency} {(result.baseline.totalCost / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500">Cost per FTE</p>
                  <p className="text-sm font-bold text-stone-900">
                    {currency} {(result.baseline.costPerFTE / 1000).toFixed(0)}k
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500">Employees</p>
                  <p className="text-sm font-bold text-stone-900">
                    {result.baseline.employeeCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Scenario */}
            <div className="rounded-lg border border-stone-200 bg-orange-50 p-4">
              <p className="mb-3 text-xs font-semibold text-orange-600">Scenario</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-stone-500">Total FTE</p>
                  <p className="text-sm font-bold text-stone-900">
                    {result.scenario.totalFTE.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500">Total Cost</p>
                  <p className="text-sm font-bold text-stone-900">
                    {currency} {(result.scenario.totalCost / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500">Cost per FTE</p>
                  <p className="text-sm font-bold text-stone-900">
                    {currency} {(result.scenario.costPerFTE / 1000).toFixed(0)}k
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500">Employees</p>
                  <p className="text-sm font-bold text-stone-900">
                    {result.scenario.employeeCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Delta */}
            <div className="rounded-lg border border-stone-200 bg-green-50 p-4">
              <p className="mb-3 text-xs font-semibold text-green-600">Impact</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-stone-500">FTE Change</p>
                  <p className={`text-sm font-bold ${result.delta.fteChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {result.delta.fteChange > 0 && '+'}{result.delta.fteChange.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500">Cost Savings</p>
                  <p className={`text-sm font-bold ${result.delta.costSavings >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {result.delta.costSavings > 0 && '+'}
                    {currency} {(result.delta.costSavings / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500">Cost Change</p>
                  <p className={`text-sm font-bold ${result.delta.costSavingsPct >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {result.delta.costSavingsPct > 0 && '+'}
                    {result.delta.costSavingsPct.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Results */}
          <ScenarioResultsEnhanced
            affectedEmployees={result.affectedEmployees}
            monthlyBurnRate={result.monthlyBurnRate}
            runway={result.runway}
            yearEndProjection={result.yearEndProjection}
            currency={currency}
            onViewEmployees={onViewEmployees}
          />

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setResult(null)}
              className="flex-1 rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              Run Another Scenario
            </button>
            <button
              onClick={handleSaveScenario}
              disabled={saving}
              className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Scenario'}
            </button>
            <button
              onClick={handleClose}
              className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-orange-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
