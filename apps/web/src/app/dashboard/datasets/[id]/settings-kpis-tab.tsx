'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle } from 'lucide-react';

interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  formula: string;
  isDefault?: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface SettingsKPIsTabProps {
  datasetId: string;
}

export default function SettingsKPIsTab({ datasetId }: SettingsKPIsTabProps) {
  const router = useRouter();
  const [allKPIs, setAllKPIs] = useState<KPIDefinition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadKPIDefinitions();
    loadCurrentSettings();
  }, [datasetId]);

  const loadKPIDefinitions = async () => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}/kpis`, {
        method: 'OPTIONS',
      });
      const data = await response.json();

      if (response.ok) {
        setAllKPIs(data.allKPIs);
        setCategories(data.categories);
      }
    } catch (err: any) {
      console.error('Failed to load KPI definitions:', err);
    }
  };

  const loadCurrentSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/datasets/${datasetId}/settings`);
      const data = await response.json();

      if (response.ok && data.settings) {
        const selected = data.settings.selectedKPIs || [];
        // If no KPIs selected yet, use defaults
        if (selected.length === 0) {
          const defaults = allKPIs.filter(kpi => kpi.isDefault).map(kpi => kpi.id);
          setSelectedKPIs(defaults);
        } else {
          setSelectedKPIs(selected);
        }
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleKPI = (kpiId: string) => {
    setSelectedKPIs(prev =>
      prev.includes(kpiId)
        ? prev.filter(id => id !== kpiId)
        : [...prev, kpiId]
    );
  };

  const selectAllInCategory = (category: string) => {
    const categoryKPIs = allKPIs.filter(kpi => kpi.category === category).map(kpi => kpi.id);
    const allSelected = categoryKPIs.every(id => selectedKPIs.includes(id));

    if (allSelected) {
      // Deselect all in category
      setSelectedKPIs(prev => prev.filter(id => !categoryKPIs.includes(id)));
    } else {
      // Select all in category
      setSelectedKPIs(prev => [...new Set([...prev, ...categoryKPIs])]);
    }
  };

  const selectDefaults = () => {
    const defaults = allKPIs.filter(kpi => kpi.isDefault).map(kpi => kpi.id);
    setSelectedKPIs(defaults);
  };

  const selectAll = () => {
    setSelectedKPIs(allKPIs.map(kpi => kpi.id));
  };

  const clearAll = () => {
    setSelectedKPIs([]);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/datasets/${datasetId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedKPIs }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('KPI settings saved successfully! Redirecting to analytics...');
      router.refresh();

      // Navigate back to analytics after a short delay to show success message
      setTimeout(() => {
        router.push(`/dashboard/datasets/${datasetId}/analytics`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const groupedKPIs = allKPIs.reduce((acc, kpi) => {
    if (!acc[kpi.category]) {
      acc[kpi.category] = [];
    }
    acc[kpi.category].push(kpi);
    return acc;
  }, {} as Record<string, KPIDefinition[]>);

  if (loading) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
        <p className="text-sm text-stone-600">Loading KPI settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-stone-900">KPI Dashboard Configuration</h2>
        <p className="text-xs text-stone-500 mt-1">
          Select which KPIs to display in your analytics dashboard
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={selectDefaults}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Select Defaults ({allKPIs.filter(kpi => kpi.isDefault).length})
        </button>
        <button
          onClick={selectAll}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Select All ({allKPIs.length})
        </button>
        <button
          onClick={clearAll}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Clear All
        </button>
        <div className="ml-auto text-xs text-stone-600">
          {selectedKPIs.length} KPIs selected
        </div>
      </div>

      {/* KPI Categories */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryKPIs = groupedKPIs[category.id] || [];
          const allCategorySelected = categoryKPIs.every(kpi => selectedKPIs.includes(kpi.id));
          const someCategorySelected = categoryKPIs.some(kpi => selectedKPIs.includes(kpi.id));

          return (
            <div key={category.id} className="rounded-lg border border-stone-200 bg-white p-4">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200">
                <h3 className="text-sm font-semibold text-stone-900">{category.name}</h3>
                <button
                  onClick={() => selectAllInCategory(category.id)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  {allCategorySelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* KPI List */}
              <div className="space-y-2">
                {categoryKPIs.map((kpi) => {
                  const isSelected = selectedKPIs.includes(kpi.id);

                  return (
                    <button
                      key={kpi.id}
                      onClick={() => toggleKPI(kpi.id)}
                      className={`w-full text-left rounded-lg border p-3 transition-all ${
                        isSelected
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-orange-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-stone-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`text-sm font-medium ${isSelected ? 'text-orange-900' : 'text-stone-900'}`}>
                              {kpi.name}
                            </p>
                            {kpi.isDefault && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                Default
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mb-1 ${isSelected ? 'text-orange-700' : 'text-stone-600'}`}>
                            {kpi.description}
                          </p>
                          <p className={`text-[10px] font-mono ${isSelected ? 'text-orange-600' : 'text-stone-500'}`}>
                            {kpi.formula}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
        <button
          onClick={() => router.back()}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save KPI Settings'}
        </button>
      </div>
    </div>
  );
}
