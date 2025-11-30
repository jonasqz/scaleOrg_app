'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Eye, Calendar, TrendingDown, TrendingUp } from 'lucide-react';

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

interface SavedScenariosListProps {
  datasetId: string;
  currency: string;
  onViewScenario?: (scenario: SavedScenario) => void;
}

export default function SavedScenariosList({
  datasetId,
  currency,
  onViewScenario,
}: SavedScenariosListProps) {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadScenarios();
  }, [datasetId]);

  const loadScenarios = async () => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}/scenarios/list`);
      if (!response.ok) throw new Error('Failed to load scenarios');
      const data = await response.json();
      setScenarios(data.scenarios || []);
    } catch (error) {
      console.error('Load scenarios error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scenarioId: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;

    setDeleting(scenarioId);
    try {
      const response = await fetch(`/api/datasets/${datasetId}/scenarios/${scenarioId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete scenario');

      // Remove from list
      setScenarios(scenarios.filter((s) => s.id !== scenarioId));
    } catch (error) {
      console.error('Delete scenario error:', error);
      alert('Failed to delete scenario');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
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

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-gray-600">Loading scenarios...</p>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-gray-600">No saved scenarios yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Run a scenario analysis and save it to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Saved Scenarios ({scenarios.length})
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario) => {
          const latestResult = scenario.results?.[0];
          const delta = latestResult?.delta;

          return (
            <div
              key={scenario.id}
              onClick={() => router.push(`/dashboard/datasets/${datasetId}/scenarios/${scenario.id}`)}
              className="cursor-pointer rounded-lg border bg-white p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{scenario.name}</h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      {getTypeLabel(scenario.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {formatDate(scenario.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(scenario.id);
                    }}
                    disabled={deleting === scenario.id}
                    className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Delete scenario"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Metrics Summary */}
              {delta && (
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                  <div>
                    <p className="text-xs text-gray-600">FTE Change</p>
                    <p
                      className={`text-lg font-bold ${
                        delta.fteChange >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {delta.fteChange > 0 && '+'}
                      {delta.fteChange.toFixed(1)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600">Cost Impact</p>
                    <p
                      className={`text-lg font-bold ${
                        delta.costSavings >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {delta.costSavings > 0 && '+'}
                      {currency} {(delta.costSavings / 1000000).toFixed(2)}M
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline Indicators */}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
                {scenario.affectedEmployees && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {JSON.parse(JSON.stringify(scenario.affectedEmployees)).length} changes
                    </span>
                  </div>
                )}
                {scenario.runway && JSON.parse(JSON.stringify(scenario.runway)).runwayExtensionMonths && (
                  <div className="flex items-center gap-1">
                    {JSON.parse(JSON.stringify(scenario.runway)).runwayExtensionMonths > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span>
                      {Math.abs(JSON.parse(JSON.stringify(scenario.runway)).runwayExtensionMonths).toFixed(1)}mo
                      runway impact
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
