'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';

interface SettingsFormProps {
  datasetId: string;
}

type Category = 'R&D' | 'GTM' | 'G&A' | 'Operations' | 'Other';

const CATEGORIES: Category[] = ['R&D', 'GTM', 'G&A', 'Operations', 'Other'];

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  'R&D': { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
  'GTM': { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
  'G&A': { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200' },
  'Operations': { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
  'Other': { bg: 'bg-gray-50', text: 'text-gray-900', border: 'border-gray-200' },
};

export default function SettingsDepartmentsTab({ datasetId }: SettingsFormProps) {
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentCategories, setDepartmentCategories] = useState<Record<string, Category>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load current settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`/api/datasets/${datasetId}/settings`);
        if (res.ok) {
          const data = await res.json();
          setDepartments(data.departments || []);
          setDepartmentCategories(data.departmentCategories || {});
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [datasetId]);

  const updateCategory = (department: string, category: Category) => {
    setDepartmentCategories(prev => ({
      ...prev,
      [department]: category,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/datasets/${datasetId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentCategories,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
        <p className="text-xs font-medium text-yellow-900">No departments found</p>
        <p className="mt-1 text-[11px] text-yellow-700">
          Add employees to your dataset to see department settings
        </p>
      </div>
    );
  }

  // Group departments by category for display
  const departmentsByCategory: Record<Category, string[]> = {
    'R&D': [],
    'GTM': [],
    'G&A': [],
    'Operations': [],
    'Other': [],
  };

  departments.forEach(dept => {
    const category = departmentCategories[dept] || 'Other';
    departmentsByCategory[category].push(dept);
  });

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-900'
              : 'bg-red-50 text-red-900'
          }`}
        >
          <p className="text-xs">{message.text}</p>
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
        <h3 className="text-xs font-semibold text-orange-900">Department Categorization</h3>
        <p className="mt-1.5 text-[11px] text-orange-800">
          All departments from your employee data are listed below. Categorize each department to improve
          analytics calculations like R&D to GTM ratio, department benchmarks, and recommendations.
        </p>
      </div>

      {/* Category Sections */}
      {CATEGORIES.map(category => {
        const depts = departmentsByCategory[category];
        const colors = CATEGORY_COLORS[category];

        return (
          <div key={category} className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-4`}>
            <div className="mb-3">
              <h3 className={`text-sm font-semibold ${colors.text}`}>{category}</h3>
              <p className="mt-1 text-xs text-stone-700">
                {category === 'R&D' && 'Engineering, Product, Design, Data, QA, Research & Development'}
                {category === 'GTM' && 'Sales, Marketing, Customer Success, Partnerships, Revenue Operations'}
                {category === 'G&A' && 'Finance, HR, Legal, IT, Admin, Recruiting, People Operations'}
                {category === 'Operations' && 'Logistics, Manufacturing, Supply Chain, Facilities, Production'}
                {category === 'Other' && 'Departments that don\'t fit other categories'}
              </p>
            </div>

            <div className="space-y-2">
              {depts.length === 0 ? (
                <p className="text-xs text-stone-500">No departments in this category</p>
              ) : (
                depts.map(dept => (
                  <div key={dept} className="flex items-center justify-between rounded-md border border-stone-200 bg-white p-3">
                    <span className="text-xs font-medium text-stone-900">{dept}</span>
                    <select
                      value={departmentCategories[dept] || 'Other'}
                      onChange={(e) => updateCategory(dept, e.target.value as Category)}
                      className="rounded-md border border-stone-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Impact Info */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h4 className="text-xs font-medium text-yellow-900">How This Affects Analytics</h4>
        <ul className="mt-2 space-y-0.5 text-[11px] text-yellow-800">
          <li>• <strong>R&D to GTM Ratio:</strong> Calculated using employees in R&D vs GTM categories</li>
          <li>• <strong>Department Benchmarks:</strong> Compared against industry standards per category</li>
          <li>• <strong>Recommendations:</strong> AI suggestions analyze balance between categories</li>
          <li>• <strong>Team Structure:</strong> Insights about organizational composition and efficiency</li>
        </ul>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
