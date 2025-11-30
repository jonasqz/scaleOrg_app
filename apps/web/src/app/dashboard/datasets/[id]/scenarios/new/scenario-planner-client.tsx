'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Play,
  UserMinus,
  UserPlus,
  Calendar,
  DollarSign,
  Search,
  X,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import ScenarioResultsEnhanced from '../../scenario-results-enhanced';

interface Employee {
  id: string;
  employeeId: string | null;
  employeeName: string | null;
  email: string | null;
  department: string;
  role: string | null;
  level: string | null;
  totalCompensation: number;
  fteFactor: number;
  startDate: Date | null;
}

interface EmployeeChange {
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

interface ScenarioPlannerClientProps {
  datasetId: string;
  datasetName: string;
  currency: string;
  employees: Employee[];
}

export default function ScenarioPlannerClient({
  datasetId,
  datasetName,
  currency,
  employees,
}: ScenarioPlannerClientProps) {
  const router = useRouter();
  const [scenarioName, setScenarioName] = useState('');
  const [description, setDescription] = useState('');
  const [currentCash, setCurrentCash] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [employeeChanges, setEmployeeChanges] = useState<EmployeeChange[]>([]);
  const [newHires, setNewHires] = useState<EmployeeChange[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get unique departments
  const departments = ['all', ...Array.from(new Set(employees.map((e) => e.department)))];

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDepartment === 'all' || emp.department === selectedDepartment;

    return matchesSearch && matchesDept;
  });

  // Check if employee is marked for removal
  const isMarkedForRemoval = (empId: string) => {
    return employeeChanges.some((change) => change.employeeId === empId && change.action === 'remove');
  };

  // Toggle employee removal
  const toggleEmployeeRemoval = (emp: Employee) => {
    if (isMarkedForRemoval(emp.id)) {
      // Remove from changes
      setEmployeeChanges(employeeChanges.filter((c) => c.employeeId !== emp.id));
    } else {
      // Add to removals
      const change: EmployeeChange = {
        id: emp.id,
        employeeId: emp.id,
        employeeName: emp.employeeName,
        department: emp.department,
        role: emp.role,
        totalCompensation: emp.totalCompensation,
        action: 'remove',
        effectiveDate: getDefaultEffectiveDate('remove'),
      };
      setEmployeeChanges([...employeeChanges, change]);
    }
  };

  // Update effective date for a change
  const updateEffectiveDate = (changeId: string, date: Date, isNewHire: boolean = false) => {
    if (isNewHire) {
      setNewHires(
        newHires.map((h) => (h.id === changeId ? { ...h, effectiveDate: date } : h))
      );
    } else {
      setEmployeeChanges(
        employeeChanges.map((c) => (c.id === changeId ? { ...c, effectiveDate: date } : c))
      );
    }
  };

  // Add new hire
  const addNewHire = () => {
    const newHire: EmployeeChange = {
      id: `new_${Date.now()}`,
      employeeId: `new_${Date.now()}`,
      employeeName: null,
      department: departments[1] || 'Engineering',
      role: null,
      totalCompensation: 100000,
      action: 'add',
      effectiveDate: getDefaultEffectiveDate('add'),
      isNew: true,
    };
    setNewHires([...newHires, newHire]);
  };

  // Update new hire details
  const updateNewHire = (id: string, field: string, value: any) => {
    setNewHires(
      newHires.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
  };

  // Remove new hire
  const removeNewHire = (id: string) => {
    setNewHires(newHires.filter((h) => h.id !== id));
  };

  // Get default effective date
  const getDefaultEffectiveDate = (action: 'remove' | 'add'): Date => {
    const today = new Date();
    const daysToAdd = action === 'remove' ? 30 : 60;
    const date = new Date(today);
    date.setDate(date.getDate() + daysToAdd);
    return date;
  };

  // Run scenario
  const handleRunScenario = async () => {
    setLoading(true);
    try {
      const allChanges = [...employeeChanges, ...newHires];

      const response = await fetch(`/api/datasets/${datasetId}/scenarios/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          name: scenarioName || 'Custom Workforce Plan',
          currentCash: currentCash ? parseFloat(currentCash) : undefined,
          includeTimeline: true,
          affectedEmployees: allChanges,
        }),
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

  // Save scenario
  const handleSave = async () => {
    if (!result) {
      alert('Please run the scenario first');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/datasets/${datasetId}/scenarios/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scenarioName || 'Custom Workforce Plan',
          description,
          type: 'custom',
          parameters: {
            employeeChanges,
            newHires,
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
        }),
      });

      if (!response.ok) throw new Error('Failed to save scenario');

      alert('Scenario saved successfully!');
      router.push(`/dashboard/datasets/${datasetId}?tab=scenarios`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  const totalRemovals = employeeChanges.filter((c) => c.action === 'remove').length;
  const totalAdditions = newHires.length;

  return (
    <div className="space-y-6">
      {/* Scenario Info */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Scenario Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scenario Name *
            </label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g., Q2 2025 Restructuring Plan"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this scenario..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Cash Balance (optional - for runway analysis)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">{currency}</span>
              <input
                type="number"
                value={currentCash}
                onChange={(e) => setCurrentCash(e.target.value)}
                placeholder="e.g., 2500000"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-12 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="rounded-lg border bg-purple-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">
                {totalRemovals} to remove
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                {totalAdditions} to add
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunScenario}
              disabled={loading || (totalRemovals === 0 && totalAdditions === 0)}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {loading ? 'Running...' : 'Run Scenario'}
            </button>
            {result && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-purple-600 bg-white px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Scenario'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Employee Selection */}
      {!result && (
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Select Employees</h2>
            <button
              onClick={addNewHire}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <UserPlus className="h-4 w-4" />
              Add New Hire
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* New Hires List */}
          {newHires.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-green-700">
                New Hires ({newHires.length})
              </h3>
              <div className="space-y-3">
                {newHires.map((hire) => (
                  <div
                    key={hire.id}
                    className="rounded-lg border border-green-200 bg-green-50 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-green-600" />
                        <span className="rounded bg-green-600 px-2 py-0.5 text-xs text-white">
                          New Hire
                        </span>
                      </div>
                      <button
                        onClick={() => removeNewHire(hire.id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Name</label>
                        <input
                          type="text"
                          value={hire.employeeName || ''}
                          onChange={(e) => updateNewHire(hire.id, 'employeeName', e.target.value)}
                          placeholder="Employee name"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Department</label>
                        <select
                          value={hire.department}
                          onChange={(e) => updateNewHire(hire.id, 'department', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        >
                          {departments.filter((d) => d !== 'all').map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Role</label>
                        <input
                          type="text"
                          value={hire.role || ''}
                          onChange={(e) => updateNewHire(hire.id, 'role', e.target.value)}
                          placeholder="Role"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Compensation</label>
                        <input
                          type="number"
                          value={hire.totalCompensation}
                          onChange={(e) =>
                            updateNewHire(hire.id, 'totalCompensation', parseFloat(e.target.value))
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={hire.effectiveDate?.toISOString().split('T')[0] || ''}
                        onChange={(e) =>
                          updateEffectiveDate(hire.id, new Date(e.target.value), true)
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Employees */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Current Employees ({filteredEmployees.length})
            </h3>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {filteredEmployees.map((emp) => {
                const markedForRemoval = isMarkedForRemoval(emp.id);
                const change = employeeChanges.find((c) => c.employeeId === emp.id);

                return (
                  <div
                    key={emp.id}
                    className={`rounded-lg border p-3 transition-all ${
                      markedForRemoval
                        ? 'border-red-300 bg-red-50 opacity-75'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {emp.employeeName || 'Unnamed Employee'}
                          </p>
                          {markedForRemoval && (
                            <span className="rounded bg-red-600 px-2 py-0.5 text-xs text-white">
                              To Remove
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                          <span>{emp.department}</span>
                          {emp.role && <span>· {emp.role}</span>}
                          <span>
                            · {currency} {(emp.totalCompensation / 1000).toFixed(0)}k/yr
                          </span>
                        </div>

                        {markedForRemoval && change && (
                          <div className="mt-2">
                            <label className="block text-xs text-gray-600 mb-1">
                              Removal Date
                            </label>
                            <input
                              type="date"
                              value={change.effectiveDate?.toISOString().split('T')[0] || ''}
                              onChange={(e) =>
                                updateEffectiveDate(change.id, new Date(e.target.value))
                              }
                              className="rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggleEmployeeRemoval(emp)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                          markedForRemoval
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {markedForRemoval ? 'Undo' : 'Remove'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <div className="rounded-lg bg-purple-50 p-4">
            <h3 className="font-semibold text-purple-900">Scenario Results</h3>
            <p className="mt-1 text-sm text-purple-700">Analysis complete - review and save</p>
          </div>

          {/* Comparison Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-600">Current (Baseline)</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Total FTE</p>
                  <p className="text-lg font-bold text-gray-900">
                    {result.baseline.totalFTE.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Cost</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currency} {(result.baseline.totalCost / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Employees</p>
                  <p className="text-lg font-bold text-gray-900">
                    {result.baseline.employeeCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-purple-50 p-4">
              <p className="mb-3 text-sm font-semibold text-purple-600">Scenario</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Total FTE</p>
                  <p className="text-lg font-bold text-gray-900">
                    {result.scenario.totalFTE.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Cost</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currency} {(result.scenario.totalCost / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Employees</p>
                  <p className="text-lg font-bold text-gray-900">
                    {result.scenario.employeeCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-green-50 p-4">
              <p className="mb-3 text-sm font-semibold text-green-600">Impact</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">FTE Change</p>
                  <p
                    className={`text-lg font-bold ${
                      result.delta.fteChange >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {result.delta.fteChange > 0 && '+'}
                    {result.delta.fteChange.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cost Savings</p>
                  <p
                    className={`text-lg font-bold ${
                      result.delta.costSavings >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {result.delta.costSavings > 0 && '+'}
                    {currency} {(result.delta.costSavings / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cost Change</p>
                  <p
                    className={`text-lg font-bold ${
                      result.delta.costSavingsPct >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {result.delta.costSavingsPct > 0 && '+'}
                    {result.delta.costSavingsPct.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <ScenarioResultsEnhanced
            affectedEmployees={result.affectedEmployees}
            monthlyBurnRate={result.monthlyBurnRate}
            runway={result.runway}
            yearEndProjection={result.yearEndProjection}
            currency={currency}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setResult(null)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Modify Scenario
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Scenario'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
