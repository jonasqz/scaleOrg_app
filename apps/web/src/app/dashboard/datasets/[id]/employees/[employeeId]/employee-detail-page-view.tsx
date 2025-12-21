'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Calendar, Mail, Briefcase, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
  id: string;
  employeeName: string | null;
  email: string | null;
  department: string;
  role: string | null;
  level: string | null;
  employmentType: string;
  totalCompensation: number;
  annualSalary: number | null;
  bonus: number | null;
  equityValue: number | null;
  fteFactor: number;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  gender: string | null;
  managerId: string | null;
  costCenter: string | null;
}

interface EmployeeDetailPageViewProps {
  employee: Employee;
  datasetId: string;
  currency: string;
  allEmployees: Employee[];
}

export default function EmployeeDetailPageView({
  employee: currentEmployee,
  datasetId,
  currency,
  allEmployees,
}: EmployeeDetailPageViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extract unique departments and locations from existing employees
  const existingDepartments = useMemo(
    () => Array.from(new Set(allEmployees.map((e) => e.department))).sort(),
    [allEmployees]
  );

  const existingLocations = useMemo(
    () => Array.from(new Set(allEmployees.map((e) => e.location).filter(Boolean) as string[])).sort(),
    [allEmployees]
  );

  // State for showing "create new" input
  const [showNewDepartment, setShowNewDepartment] = useState(false);
  const [showNewLocation, setShowNewLocation] = useState(false);

  // Compensation input mode: 'annual' or 'monthly'
  const [compensationInputMode, setCompensationInputMode] = useState<'annual' | 'monthly'>('annual');

  const [formData, setFormData] = useState({
    employeeName: currentEmployee.employeeName || '',
    email: currentEmployee.email || '',
    department: currentEmployee.department,
    role: currentEmployee.role || '',
    level: currentEmployee.level || '',
    employmentType: currentEmployee.employmentType,
    totalCompensation: currentEmployee.totalCompensation.toString(),
    baseSalary: currentEmployee.annualSalary?.toString() || '',
    bonus: currentEmployee.bonus?.toString() || '',
    equityValue: currentEmployee.equityValue?.toString() || '',
    fteFactor: currentEmployee.fteFactor.toString(),
    startDate: currentEmployee.startDate
      ? new Date(currentEmployee.startDate).toISOString().split('T')[0]
      : '',
    endDate: currentEmployee.endDate
      ? new Date(currentEmployee.endDate).toISOString().split('T')[0]
      : '',
    location: currentEmployee.location || '',
    gender: currentEmployee.gender || '',
    managerId: currentEmployee.managerId || '',
    costCenter: currentEmployee.costCenter || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const multiplier = compensationInputMode === 'monthly' ? 12 : 1;

      const payload = {
        ...formData,
        totalCompensation: parseFloat(formData.totalCompensation) * multiplier,
        annualSalary: formData.baseSalary ? parseFloat(formData.baseSalary) * multiplier : null,
        bonus: formData.bonus ? parseFloat(formData.bonus) * multiplier : null,
        equityValue: formData.equityValue ? parseFloat(formData.equityValue) * multiplier : null,
        fteFactor: parseFloat(formData.fteFactor),
      };

      const response = await fetch(
        `/api/datasets/${datasetId}/employees/${currentEmployee.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error('Failed to update employee');

      toast.success('Employee updated successfully', {
        description: 'Changes have been saved',
      });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Failed to update employee', {
        description: 'Please check the form and try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${currentEmployee.employeeName || 'this employee'}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/datasets/${datasetId}/employees/${currentEmployee.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to delete employee');

      toast.success('Employee deleted', {
        description: `${currentEmployee.employeeName || 'Employee'} has been removed from the team`,
      });
      router.push(`/dashboard/datasets/${datasetId}`);
      router.refresh();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee', {
        description: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTenure = () => {
    if (!currentEmployee.startDate) return null;
    const start = new Date(currentEmployee.startDate);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years}y ${remainingMonths}m`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    // Use UTC to avoid hydration mismatch
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { timeZone: 'UTC' });
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
                {currentEmployee.employeeName || 'Unnamed Employee'}
              </h1>
              <p className="text-xs text-stone-500">
                {currentEmployee.role || currentEmployee.department}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                disabled={loading}
                className="rounded-lg border border-stone-200 px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-xs text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors"
              >
                Edit Employee
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Total Compensation</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-stone-900">
            {currency} {currentEmployee.totalCompensation.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Briefcase className="h-3.5 w-3.5" />
            <span>Department</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-stone-900">
            {currentEmployee.department}
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>Tenure</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-stone-900">
            {calculateTenure() || 'N/A'}
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <User className="h-3.5 w-3.5" />
            <span>Status</span>
          </div>
          <p className={`mt-1 text-sm font-semibold ${
            currentEmployee.endDate ? 'text-red-600' : 'text-green-600'
          }`}>
            {currentEmployee.endDate ? 'Terminated' : 'Active'}
          </p>
          <p className="text-[10px] text-stone-500">
            {currentEmployee.employmentType}
          </p>
        </div>
      </div>

      {/* Main Form */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="space-y-6">
          {/* Personal Information - truncated for brevity, continuing in next message */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-stone-900">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.employeeName || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  <Mail className="inline h-3.5 w-3.5 mr-1" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.email || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Start Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {formatDate(currentEmployee.startDate)}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  End Date
                  <span className="ml-1 text-[10px] text-stone-500">(Optional)</span>
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    {formData.endDate && (
                      <p className="mt-1 text-[10px] text-red-600">
                        This employee will be marked as terminated
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className={`rounded-md border border-stone-200 px-4 py-2 text-xs ${
                      currentEmployee.endDate ? 'bg-red-50 text-red-900' : 'bg-stone-50 text-stone-900'
                    }`}>
                      {currentEmployee.endDate ? formatDate(currentEmployee.endDate) : 'Active'}
                    </p>
                    {currentEmployee.endDate && (
                      <p className="mt-1 text-[10px] text-red-600">
                        Employee terminated
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., San Francisco, CA"
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.location || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Gender</label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="DIVERSE">Diverse</option>
                  </select>
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.gender === 'MALE' ? 'Male' :
                     currentEmployee.gender === 'FEMALE' ? 'Female' :
                     currentEmployee.gender === 'DIVERSE' ? 'Diverse' :
                     'Prefer not to say'}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-stone-500">
                  Optional: Used for pay gap analysis
                </p>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-stone-900">Employment Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Department</label>
                {isEditing ? (
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {existingDepartments.length === 0 && (
                      <>
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                      </>
                    )}
                    {existingDepartments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.department}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Role / Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Senior Software Engineer"
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.role || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Level</label>
                {isEditing ? (
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select level...</option>
                    <option value="IC">IC (Individual Contributor)</option>
                    <option value="MANAGER">Manager</option>
                    <option value="DIRECTOR">Director</option>
                    <option value="VP">VP</option>
                    <option value="C_LEVEL">C-Level</option>
                  </select>
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.level || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Employment Type</label>
                {isEditing ? (
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="FTE">FTE (Full-time)</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="INTERN">Intern</option>
                  </select>
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.employmentType}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">FTE Factor</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.fteFactor}
                    onChange={(e) => setFormData({ ...formData, fteFactor: e.target.value })}
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.fteFactor}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Cost Center</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.costCenter}
                    onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                    placeholder="CC-1001"
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.costCenter || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900">Compensation Breakdown</h3>
              {isEditing && (
                <div className="inline-flex rounded-lg border border-stone-300 bg-stone-50 p-1">
                  <button
                    type="button"
                    onClick={() => setCompensationInputMode('annual')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      compensationInputMode === 'annual'
                        ? 'bg-orange-600 text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Annual
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompensationInputMode('monthly')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      compensationInputMode === 'monthly'
                        ? 'bg-orange-600 text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              )}
            </div>
            {isEditing && (
              <p className="mb-4 text-xs text-stone-600">
                {compensationInputMode === 'monthly'
                  ? 'Enter monthly values. They will be converted to annual (×12) when saved.'
                  : 'Enter annual values. All compensation is stored annually.'}
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Total {isEditing && compensationInputMode === 'monthly' ? 'Monthly' : 'Annual'} Compensation
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="number"
                      value={formData.totalCompensation}
                      onChange={(e) => setFormData({ ...formData, totalCompensation: e.target.value })}
                      className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    {formData.totalCompensation && parseFloat(formData.totalCompensation) > 0 && (
                      <p className="mt-1 text-[10px] text-stone-500">
                        {compensationInputMode === 'monthly'
                          ? `≈ ${currency} ${(parseFloat(formData.totalCompensation) * 12).toLocaleString()} annually`
                          : `≈ ${currency} ${(parseFloat(formData.totalCompensation) / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly`}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                      {currency} {currentEmployee.totalCompensation.toLocaleString()} / year
                    </p>
                    <p className="mt-1 text-[10px] text-stone-500">
                      {currency} {(currentEmployee.totalCompensation / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} / month
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Base Salary ({isEditing && compensationInputMode === 'monthly' ? 'Monthly' : 'Annual'})
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="number"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      placeholder="Optional"
                      className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    {formData.baseSalary && parseFloat(formData.baseSalary) > 0 && (
                      <p className="mt-1 text-[10px] text-stone-500">
                        {compensationInputMode === 'monthly'
                          ? `≈ ${currency} ${(parseFloat(formData.baseSalary) * 12).toLocaleString()} annually`
                          : `≈ ${currency} ${(parseFloat(formData.baseSalary) / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly`}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                      {currentEmployee.annualSalary
                        ? `${currency} ${currentEmployee.annualSalary.toLocaleString()} / year`
                        : 'N/A'}
                    </p>
                    {currentEmployee.annualSalary && (
                      <p className="mt-1 text-[10px] text-stone-500">
                        {currency} {(currentEmployee.annualSalary / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} / month
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Bonus ({isEditing && compensationInputMode === 'monthly' ? 'Monthly' : 'Annual'})
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    placeholder="Optional"
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.bonus
                      ? `${currency} ${currentEmployee.bonus.toLocaleString()} / year`
                      : 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Equity Value ({isEditing && compensationInputMode === 'monthly' ? 'Monthly' : 'Annual'})
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.equityValue}
                    onChange={(e) => setFormData({ ...formData, equityValue: e.target.value })}
                    placeholder="Optional"
                    className="w-full rounded-md border border-stone-300 px-4 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                ) : (
                  <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-900">
                    {currentEmployee.equityValue
                      ? `${currency} ${currentEmployee.equityValue.toLocaleString()} / year`
                      : 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
