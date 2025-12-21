'use client';

import { X } from 'lucide-react';
import ScenarioResultsEnhanced from './scenario-results-enhanced';

interface SavedScenario {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  calculatedAt: Date | null;
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

interface ScenarioDetailsModalProps {
  scenario: SavedScenario | null;
  currency: string;
  onClose: () => void;
}

export default function ScenarioDetailsModal({
  scenario,
  currency,
  onClose,
}: ScenarioDetailsModalProps) {
  if (!scenario) return null;

  const latestResult = scenario.results?.[0];
  const baseline = latestResult?.metrics?.baseline;
  const scenarioMetrics = latestResult?.metrics?.scenario;
  const delta = latestResult?.delta;

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

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-white px-4 py-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">{scenario.name}</h2>
              <div className="mt-2 flex items-center gap-3">
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                  {getTypeLabel(scenario.type)}
                </span>
                <span className="text-xs text-stone-500">
                  Created: {formatDate(scenario.createdAt)}
                </span>
              </div>
              {scenario.description && (
                <p className="mt-2 text-xs text-stone-600">{scenario.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-stone-400 transition-colors hover:bg-orange-50 hover:text-orange-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-4">
          {/* Comparison Grid */}
          {baseline && scenarioMetrics && delta && (
            <div className="grid gap-4 md:grid-cols-3">
              {/* Baseline */}
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <p className="mb-3 text-xs font-semibold text-stone-600">Current (Baseline)</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-stone-500">Total FTE</p>
                    <p className="text-sm font-bold text-stone-900">
                      {baseline.totalFTE.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-500">Total Cost</p>
                    <p className="text-sm font-bold text-stone-900">
                      {currency} {(baseline.totalCost / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-500">Cost per FTE</p>
                    <p className="text-sm font-bold text-stone-900">
                      {currency} {(baseline.costPerFTE / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-500">Employees</p>
                    <p className="text-sm font-bold text-stone-900">
                      {baseline.employeeCount}
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
                      {scenarioMetrics.totalFTE.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-500">Total Cost</p>
                    <p className="text-sm font-bold text-stone-900">
                      {currency} {(scenarioMetrics.totalCost / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-500">Cost per FTE</p>
                    <p className="text-sm font-bold text-stone-900">
                      {currency} {(scenarioMetrics.costPerFTE / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-500">Employees</p>
                    <p className="text-sm font-bold text-stone-900">
                      {scenarioMetrics.employeeCount}
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
                    <p className={`text-sm font-bold ${delta.fteChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {delta.fteChange > 0 && '+'}{delta.fteChange.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-500">Cost Savings</p>
                    <p className={`text-sm font-bold ${delta.costSavings >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {delta.costSavings > 0 && '+'}
                      {currency} {(delta.costSavings / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-500">Cost Change</p>
                    <p className={`text-sm font-bold ${delta.costSavingsPct >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {delta.costSavingsPct > 0 && '+'}
                      {delta.costSavingsPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Results */}
          <ScenarioResultsEnhanced
            affectedEmployees={scenario.affectedEmployees ? JSON.parse(JSON.stringify(scenario.affectedEmployees)) : undefined}
            monthlyBurnRate={scenario.monthlyBurnRate ? JSON.parse(JSON.stringify(scenario.monthlyBurnRate)) : undefined}
            runway={scenario.runway ? JSON.parse(JSON.stringify(scenario.runway)) : undefined}
            yearEndProjection={scenario.yearEndProjection ? JSON.parse(JSON.stringify(scenario.yearEndProjection)) : undefined}
            currency={currency}
          />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-stone-200 bg-white px-4 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-orange-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
