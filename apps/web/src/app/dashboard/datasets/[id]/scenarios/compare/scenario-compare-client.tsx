'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Download,
  X,
} from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  type: string;
  createdAt: Date;
  affectedEmployees: any;
  monthlyBurnRate: any;
  runway: any;
  yearEndProjection: any;
  results: Array<{
    id: string;
    metrics: {
      baseline: any;
      scenario: any;
    };
    delta: any;
  }>;
}

interface ScenarioCompareClientProps {
  datasetId: string;
  datasetName: string;
  currency: string;
  allScenarios: Scenario[];
  initialSelectedIds: string[];
}

export default function ScenarioCompareClient({
  datasetId,
  datasetName,
  currency,
  allScenarios,
  initialSelectedIds,
}: ScenarioCompareClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  // Get selected scenarios with their data
  const selectedScenarios = useMemo(() => {
    return allScenarios.filter((s) => selectedIds.includes(s.id));
  }, [allScenarios, selectedIds]);

  // Toggle scenario selection
  const toggleScenario = (scenarioId: string) => {
    const newIds = selectedIds.includes(scenarioId)
      ? selectedIds.filter((id) => id !== scenarioId)
      : selectedIds.length < 3
      ? [...selectedIds, scenarioId]
      : selectedIds;

    setSelectedIds(newIds);

    // Update URL
    const params = new URLSearchParams();
    if (newIds.length > 0) {
      params.set('scenarios', newIds.join(','));
    }
    router.push(`/dashboard/datasets/${datasetId}/scenarios/compare?${params.toString()}`);
  };

  // Get metrics for comparison
  const getScenarioMetrics = (scenario: Scenario) => {
    const latestResult = scenario.results?.[0];
    if (!latestResult) return null;

    return {
      baseline: latestResult.metrics.baseline,
      scenario: latestResult.metrics.scenario,
      delta: latestResult.delta,
    };
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      HIRING_FREEZE: 'Hiring Freeze',
      COST_REDUCTION: 'Cost Reduction',
      GROWTH: 'Growth',
      TARGET_RATIO: 'Target Ratio',
      CUSTOM: 'Custom',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Scenario Selection */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-stone-900">
          Select Scenarios to Compare (2-3)
        </h2>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {allScenarios.map((scenario) => {
            const isSelected = selectedIds.includes(scenario.id);
            const canSelect = selectedIds.length < 3 || isSelected;

            return (
              <button
                key={scenario.id}
                onClick={() => canSelect && toggleScenario(scenario.id)}
                disabled={!canSelect}
                className={`relative rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : canSelect
                    ? 'border-stone-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                    : 'border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Selection Indicator */}
                <div className="absolute right-2 top-2">
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>

                <h3 className="mb-1 pr-8 text-xs font-semibold text-stone-900">{scenario.name}</h3>
                <div className="flex items-center gap-2 text-[10px] text-stone-500">
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">
                    {getTypeLabel(scenario.type)}
                  </span>
                  <span>{formatDate(scenario.createdAt)}</span>
                </div>

                {scenario.description && (
                  <p className="mt-2 text-xs text-stone-600 line-clamp-2">
                    {scenario.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {allScenarios.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-5 text-center">
            <p className="text-xs text-stone-600">No scenarios available to compare</p>
            <p className="mt-1 text-[10px] text-stone-500">Create some scenarios first</p>
          </div>
        )}
      </div>

      {/* Comparison View */}
      {selectedScenarios.length >= 2 && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {selectedScenarios.map((scenario) => {
              const metrics = getScenarioMetrics(scenario);
              if (!metrics) return null;

              return (
                <div key={scenario.id} className="rounded-lg border border-stone-200 bg-white p-4">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold text-stone-900">{scenario.name}</h3>
                      <p className="mt-1 text-[10px] text-stone-500">
                        {getTypeLabel(scenario.type)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleScenario(scenario.id)}
                      className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                      title="Remove from comparison"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-stone-600">FTE Impact</p>
                      <p
                        className={`text-sm font-bold ${
                          metrics.delta.fteChange >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {metrics.delta.fteChange > 0 && '+'}
                        {metrics.delta.fteChange.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {metrics.scenario.totalFTE.toFixed(1)} total FTE
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-stone-600">Cost Impact</p>
                      <p
                        className={`text-sm font-bold ${
                          metrics.delta.costSavings >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {metrics.delta.costSavings > 0 && '+'}
                        {currency} {(metrics.delta.costSavings / 1000000).toFixed(2)}M
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {metrics.delta.costSavingsPct > 0 && '+'}
                        {metrics.delta.costSavingsPct.toFixed(1)}% change
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-stone-600">Employee Count</p>
                      <p className="text-sm font-bold text-stone-900">
                        {metrics.scenario.employeeCount}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {metrics.delta.employeeChange > 0 && '+'}
                        {metrics.delta.employeeChange} change
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Comparison Table */}
          <div className="rounded-lg border border-stone-200 bg-white">
            <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-stone-900">
                Detailed Metrics Comparison
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                      Metric
                    </th>
                    {selectedScenarios.map((scenario) => (
                      <th
                        key={scenario.id}
                        className="px-4 py-2 text-left text-[10px] font-medium text-stone-500 uppercase tracking-wider"
                      >
                        {scenario.name}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                      Best/Worst
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {/* Total FTE */}
                  <tr>
                    <td className="px-4 py-3 text-xs font-medium text-stone-900">
                      Total FTE
                    </td>
                    {selectedScenarios.map((scenario) => {
                      const metrics = getScenarioMetrics(scenario);
                      return (
                        <td key={scenario.id} className="px-4 py-3 text-xs text-stone-900">
                          {metrics?.scenario.totalFTE.toFixed(1)}
                          <span
                            className={`ml-2 text-[10px] ${
                              (metrics?.delta.fteChange || 0) >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            ({metrics?.delta.fteChange > 0 && '+'}
                            {metrics?.delta.fteChange.toFixed(1)})
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {/* Find scenario with most growth */}
                      {(() => {
                        const maxFte = Math.max(
                          ...selectedScenarios.map(
                            (s) => getScenarioMetrics(s)?.delta.fteChange || 0
                          )
                        );
                        return maxFte > 0 ? (
                          <TrendingUp className="inline h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <TrendingDown className="inline h-3.5 w-3.5 text-red-600" />
                        );
                      })()}
                    </td>
                  </tr>

                  {/* Total Cost */}
                  <tr className="bg-stone-50">
                    <td className="px-4 py-3 text-xs font-medium text-stone-900">
                      Total Annual Cost
                    </td>
                    {selectedScenarios.map((scenario) => {
                      const metrics = getScenarioMetrics(scenario);
                      return (
                        <td key={scenario.id} className="px-4 py-3 text-xs text-stone-900">
                          {currency} {((metrics?.scenario.totalCost || 0) / 1000000).toFixed(2)}M
                          <span
                            className={`ml-2 text-[10px] ${
                              (metrics?.delta.costSavings || 0) >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            ({metrics?.delta.costSavings > 0 && '+'}
                            {((metrics?.delta.costSavings || 0) / 1000000).toFixed(2)}M)
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {(() => {
                        const maxSavings = Math.max(
                          ...selectedScenarios.map(
                            (s) => getScenarioMetrics(s)?.delta.costSavings || 0
                          )
                        );
                        return maxSavings > 0 ? (
                          <TrendingDown className="inline h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <TrendingUp className="inline h-3.5 w-3.5 text-red-600" />
                        );
                      })()}
                    </td>
                  </tr>

                  {/* Employee Count */}
                  <tr>
                    <td className="px-4 py-3 text-xs font-medium text-stone-900">
                      Employee Count
                    </td>
                    {selectedScenarios.map((scenario) => {
                      const metrics = getScenarioMetrics(scenario);
                      return (
                        <td key={scenario.id} className="px-4 py-3 text-xs text-stone-900">
                          {metrics?.scenario.employeeCount}
                          <span className="ml-2 text-[10px] text-stone-600">
                            ({metrics?.delta.employeeChange > 0 && '+'}
                            {metrics?.delta.employeeChange})
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-xs text-stone-500">-</td>
                  </tr>

                  {/* Average Compensation */}
                  <tr className="bg-stone-50">
                    <td className="px-4 py-3 text-xs font-medium text-stone-900">
                      Avg Compensation
                    </td>
                    {selectedScenarios.map((scenario) => {
                      const metrics = getScenarioMetrics(scenario);
                      return (
                        <td key={scenario.id} className="px-4 py-3 text-xs text-stone-900">
                          {currency}{' '}
                          {((metrics?.scenario.averageCompensation || 0) / 1000).toFixed(0)}k
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-xs text-stone-500">-</td>
                  </tr>

                  {/* Affected Employees */}
                  <tr>
                    <td className="px-4 py-3 text-xs font-medium text-stone-900">
                      Changes Applied
                    </td>
                    {selectedScenarios.map((scenario) => {
                      const affectedCount = scenario.affectedEmployees
                        ? JSON.parse(JSON.stringify(scenario.affectedEmployees)).length
                        : 0;
                      return (
                        <td key={scenario.id} className="px-4 py-3 text-xs text-stone-900">
                          {affectedCount} employee{affectedCount !== 1 ? 's' : ''}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-xs text-stone-500">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Comparison Chart */}
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-6 text-sm font-semibold text-stone-900">
              Visual Comparison
            </h2>

            <div className="space-y-6">
              {/* FTE Change Comparison */}
              <div>
                <h3 className="mb-4 text-xs font-medium text-stone-700">FTE Impact</h3>
                {selectedScenarios.map((scenario) => {
                  const metrics = getScenarioMetrics(scenario);
                  if (!metrics) return null;

                  const fteChange = metrics.delta.fteChange;
                  const maxAbsChange = Math.max(
                    ...selectedScenarios.map(
                      (s) => Math.abs(getScenarioMetrics(s)?.delta.fteChange || 0)
                    )
                  );
                  const barWidth = maxAbsChange > 0 ? Math.abs(fteChange / maxAbsChange) * 100 : 0;

                  return (
                    <div key={scenario.id} className="mb-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-stone-700">{scenario.name}</span>
                        <span
                          className={`text-xs font-medium ${
                            fteChange >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {fteChange > 0 && '+'}
                          {fteChange.toFixed(1)} FTE
                        </span>
                      </div>
                      <div className="h-6 w-full rounded-full bg-stone-100">
                        <div
                          className={`h-6 rounded-full ${
                            fteChange >= 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cost Savings Comparison */}
              <div>
                <h3 className="mb-4 text-xs font-medium text-stone-700">Cost Impact</h3>
                {selectedScenarios.map((scenario) => {
                  const metrics = getScenarioMetrics(scenario);
                  if (!metrics) return null;

                  const costSavings = metrics.delta.costSavings;
                  const maxAbsChange = Math.max(
                    ...selectedScenarios.map(
                      (s) => Math.abs(getScenarioMetrics(s)?.delta.costSavings || 0)
                    )
                  );
                  const barWidth =
                    maxAbsChange > 0 ? Math.abs(costSavings / maxAbsChange) * 100 : 0;

                  return (
                    <div key={scenario.id} className="mb-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-stone-700">{scenario.name}</span>
                        <span
                          className={`text-xs font-medium ${
                            costSavings >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {costSavings > 0 && '+'}
                          {currency} {(costSavings / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="h-6 w-full rounded-full bg-stone-100">
                        <div
                          className={`h-6 rounded-full ${
                            costSavings >= 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors"
              onClick={() => alert('Export to PDF coming soon!')}
            >
              <Download className="h-4 w-4" />
              Export Comparison
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedScenarios.length < 2 && selectedScenarios.length > 0 && (
        <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-5 text-center">
          <p className="text-xs text-stone-600">
            Select at least 2 scenarios to start comparing
          </p>
          <p className="mt-1 text-[10px] text-stone-500">
            You have selected {selectedScenarios.length} scenario
          </p>
        </div>
      )}
    </div>
  );
}
