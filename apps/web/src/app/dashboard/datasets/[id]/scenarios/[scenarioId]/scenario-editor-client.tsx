'use client';

import { useState, useEffect } from 'react';
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

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  type: string;
  currentCash: any;
  affectedEmployees: any;
  monthlyBurnRate: any;
  runway: any;
  yearEndProjection: any;
  parameters: any;
  results: Array<{
    id: string;
    metrics: {
      baseline: any;
      scenario: any;
    };
    delta: any;
  }>;
}

interface ScenarioEditorClientProps {
  scenarioId: string;
  datasetId: string;
  datasetName: string;
  currency: string;
  employees: Employee[];
  initialScenario: Scenario;
}

export default function ScenarioEditorClient({
  scenarioId,
  datasetId,
  datasetName,
  currency,
  employees,
  initialScenario,
}: ScenarioEditorClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [scenarioName, setScenarioName] = useState(initialScenario.name);
  const [description, setDescription] = useState(initialScenario.description || '');
  const [currentCash, setCurrentCash] = useState(
    initialScenario.currentCash ? String(initialScenario.currentCash) : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [employeeChanges, setEmployeeChanges] = useState<EmployeeChange[]>([]);
  const [newHires, setNewHires] = useState<EmployeeChange[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load initial data
  useEffect(() => {
    // Parse affected employees from scenario
    const affectedEmployees = initialScenario.affectedEmployees || [];
    const removals: EmployeeChange[] = [];
    const additions: EmployeeChange[] = [];

    affectedEmployees.forEach((change: any) => {
      const empChange: EmployeeChange = {
        id: change.id || change.employeeId,
        employeeId: change.employeeId,
        employeeName: change.employeeName,
        department: change.department,
        role: change.role,
        totalCompensation: change.totalCompensation,
        action: change.action,
        effectiveDate: change.effectiveDate ? new Date(change.effectiveDate) : null,
        isNew: change.isNew || false,
      };

      if (change.action === 'remove') {
        removals.push(empChange);
      } else if (change.action === 'add') {
        additions.push(empChange);
      }
    });

    setEmployeeChanges(removals);
    setNewHires(additions);

    // Load results
    if (initialScenario.results && initialScenario.results.length > 0) {
      const latestResult = initialScenario.results[0];
      setResult({
        baseline: latestResult.metrics.baseline,
        scenario: latestResult.metrics.scenario,
        delta: latestResult.delta,
        affectedEmployees: initialScenario.affectedEmployees,
        monthlyBurnRate: initialScenario.monthlyBurnRate,
        runway: initialScenario.runway,
        yearEndProjection: initialScenario.yearEndProjection,
      });
    }
  }, [initialScenario]);

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
          name: scenarioName,
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

  // Update scenario
  const handleUpdate = async () => {
    if (!result) {
      alert('Please run the scenario first');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/datasets/${datasetId}/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scenarioName,
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

      if (!response.ok) throw new Error('Failed to update scenario');

      alert('Scenario updated successfully!');
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update scenario');
    } finally {
      setSaving(false);
    }
  };

  const totalRemovals = employeeChanges.filter((c) => c.action === 'remove').length;
  const totalAdditions = newHires.length;

  return (
    <div className="space-y-6">
      {/* Scenario Info */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">Scenario Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
            >
              Edit Scenario
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Scenario Name *
            </label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              disabled={!isEditing}
              className="w-full rounded-lg border border-stone-200 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-stone-50 disabled:text-stone-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isEditing}
              rows={2}
              className="w-full rounded-lg border border-stone-200 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-stone-50 disabled:text-stone-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Current Cash Balance (optional - for runway analysis)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-stone-500">{currency}</span>
              <input
                type="number"
                value={currentCash}
                onChange={(e) => setCurrentCash(e.target.value)}
                disabled={!isEditing}
                className="w-full rounded-lg border border-stone-200 px-4 py-2 pl-12 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-stone-50 disabled:text-stone-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      {isEditing && (
        <div className="rounded-lg border border-stone-200 bg-orange-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <UserMinus className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-stone-700">
                  {totalRemovals} to remove
                </span>
              </div>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-stone-700">
                  {totalAdditions} to add
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRunScenario}
                disabled={loading || (totalRemovals === 0 && totalAdditions === 0)}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                {loading ? 'Running...' : 'Re-run Scenario'}
              </button>
              {result && (
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-orange-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? 'Saving...' : 'Update Scenario'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee Selection - only in edit mode */}
      {isEditing && !result && (
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">Select Employees</h2>
            <button
              onClick={addNewHire}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add New Hire
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full rounded-lg border border-stone-200 py-2 pl-10 pr-4 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-lg border border-stone-200 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
              <h3 className="mb-3 text-xs font-semibold text-green-700">
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
                        <UserPlus className="h-3.5 w-3.5 text-green-600" />
                        <span className="rounded bg-green-600 px-2 py-0.5 text-[10px] text-white">
                          New Hire
                        </span>
                      </div>
                      <button
                        onClick={() => removeNewHire(hire.id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <div>
                        <label className="block text-[10px] text-stone-600 mb-1">Name</label>
                        <input
                          type="text"
                          value={hire.employeeName || ''}
                          onChange={(e) => updateNewHire(hire.id, 'employeeName', e.target.value)}
                          placeholder="Employee name"
                          className="w-full rounded border border-stone-200 px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-600 mb-1">Department</label>
                        <select
                          value={hire.department}
                          onChange={(e) => updateNewHire(hire.id, 'department', e.target.value)}
                          className="w-full rounded border border-stone-200 px-2 py-1 text-xs"
                        >
                          {departments.filter((d) => d !== 'all').map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-600 mb-1">Role</label>
                        <input
                          type="text"
                          value={hire.role || ''}
                          onChange={(e) => updateNewHire(hire.id, 'role', e.target.value)}
                          placeholder="Role"
                          className="w-full rounded border border-stone-200 px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-600 mb-1">Compensation</label>
                        <input
                          type="number"
                          value={hire.totalCompensation}
                          onChange={(e) =>
                            updateNewHire(hire.id, 'totalCompensation', parseFloat(e.target.value))
                          }
                          className="w-full rounded border border-stone-200 px-2 py-1 text-xs"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-[10px] text-stone-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={hire.effectiveDate?.toISOString().split('T')[0] || ''}
                        onChange={(e) =>
                          updateEffectiveDate(hire.id, new Date(e.target.value), true)
                        }
                        className="rounded border border-stone-200 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Employees */}
          <div>
            <h3 className="mb-3 text-xs font-semibold text-stone-700">
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
                        : 'border-stone-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-stone-900">
                            {emp.employeeName || 'Unnamed Employee'}
                          </p>
                          {markedForRemoval && (
                            <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] text-white">
                              To Remove
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-stone-600">
                          <span>{emp.department}</span>
                          {emp.role && <span>· {emp.role}</span>}
                          <span>
                            · {currency} {(emp.totalCompensation / 1000).toFixed(0)}k/yr
                          </span>
                        </div>

                        {markedForRemoval && change && (
                          <div className="mt-2">
                            <label className="block text-[10px] text-stone-600 mb-1">
                              Removal Date
                            </label>
                            <input
                              type="date"
                              value={change.effectiveDate?.toISOString().split('T')[0] || ''}
                              onChange={(e) =>
                                updateEffectiveDate(change.id, new Date(e.target.value))
                              }
                              className="rounded border border-stone-200 px-2 py-1 text-xs"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggleEmployeeRemoval(emp)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          markedForRemoval
                            ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
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
          {isEditing && (
            <div className="rounded-lg border border-stone-200 bg-orange-50 p-4">
              <h3 className="text-xs font-semibold text-orange-900">Updated Results</h3>
              <p className="mt-1 text-[10px] text-orange-700">
                Review the updated analysis and save changes
              </p>
            </div>
          )}

          {/* Comparison Grid */}
          <div className="grid gap-4 md:grid-cols-3">
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
                  <p className="text-[10px] text-stone-500">Employees</p>
                  <p className="text-sm font-bold text-stone-900">
                    {result.baseline.employeeCount}
                  </p>
                </div>
              </div>
            </div>

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
                  <p className="text-[10px] text-stone-500">Employees</p>
                  <p className="text-sm font-bold text-stone-900">
                    {result.scenario.employeeCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-green-50 p-4">
              <p className="mb-3 text-xs font-semibold text-green-600">Impact</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-stone-500">FTE Change</p>
                  <p
                    className={`text-sm font-bold ${
                      result.delta.fteChange >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {result.delta.fteChange > 0 && '+'}
                    {result.delta.fteChange.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500">Cost Savings</p>
                  <p
                    className={`text-sm font-bold ${
                      result.delta.costSavings >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {result.delta.costSavings > 0 && '+'}
                    {currency} {(result.delta.costSavings / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500">Cost Change</p>
                  <p
                    className={`text-sm font-bold ${
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

          {isEditing && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setIsEditing(true);
                }}
                className="flex-1 rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Modify Scenario
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Update Scenario'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
