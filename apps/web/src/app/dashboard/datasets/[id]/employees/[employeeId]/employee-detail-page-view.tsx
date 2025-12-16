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
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/datasets/${datasetId}`)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentEmployee.employeeName || 'Unnamed Employee'}
              </h1>
              <p className="text-sm text-gray-500">
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
                className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Edit Employee
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <DollarSign className="h-4 w-4" />
            <span>Total Compensation</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {currency} {currentEmployee.totalCompensation.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Briefcase className="h-4 w-4" />
            <span>Department</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {currentEmployee.department}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Tenure</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {calculateTenure() || 'N/A'}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User className="h-4 w-4" />
            <span>Employment Type</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {currentEmployee.employmentType}
          </p>
        </div>
      </div>

      {/* Main Form */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="space-y-6">
          {/* Personal Information - truncated for brevity, continuing in next message */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {currentEmployee.employeeName || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {currentEmployee.email || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {formatDate(currentEmployee.startDate)}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., San Francisco, CA"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {currentEmployee.location || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="DIVERSE">Diverse</option>
                  </select>
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {currentEmployee.gender === 'MALE' ? 'Male' :
                     currentEmployee.gender === 'FEMALE' ? 'Female' :
                     currentEmployee.gender === 'DIVERSE' ? 'Diverse' :
                     'Prefer not to say'}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Used for pay gap analysis
                </p>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Employment Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Department</label>
                {isEditing ? (
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {currentEmployee.department}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role / Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Senior Software Engineer"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {currentEmployee.role || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Level</label>
                {isEditing ? (
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select level...</option>
                    <option value="IC">IC (Individual Contributor)</option>
                    <option value="MANAGER">Manager</option>
                    <option value="DIRECTOR">Director</option>
                    <option value="VP">VP</option>
                    <option value="C_LEVEL">C-Level</option>
                  </select>
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {currentEmployee.level || 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Employment Type</label>
                {isEditing ? (
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="FTE">FTE (Full-time)</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="INTERN">Intern</option>
                  </select>
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {currentEmployee.employmentType}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">FTE Factor</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.fteFactor}
                    onChange={(e) => setFormData({ ...formData, fteFactor: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {currentEmployee.fteFactor}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Cost Center</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.costCenter}
                    onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                    placeholder="CC-1001"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {currentEmployee.costCenter || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Compensation Breakdown</h3>
              {isEditing && (
                <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setCompensationInputMode('annual')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      compensationInputMode === 'annual'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Annual
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompensationInputMode('monthly')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      compensationInputMode === 'monthly'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              )}
            </div>
            {isEditing && (
              <p className="mb-4 text-sm text-gray-600">
                {compensationInputMode === 'monthly'
                  ? 'Enter monthly values. They will be converted to annual (×12) when saved.'
                  : 'Enter annual values. All compensation is stored annually.'}
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Total {isEditing && compensationInputMode === 'monthly' ? 'Monthly' : 'Annual'} Compensation
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="number"
                      value={formData.totalCompensation}
                      onChange={(e) => setFormData({ ...formData, totalCompensation: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {formData.totalCompensation && parseFloat(formData.totalCompensation) > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {compensationInputMode === 'monthly'
                          ? `≈ ${currency} ${(parseFloat(formData.totalCompensation) * 12).toLocaleString()} annually`
                          : `≈ ${currency} ${(parseFloat(formData.totalCompensation) / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly`}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                      {currency} {currentEmployee.totalCompensation.toLocaleString()} / year
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {currency} {(currentEmployee.totalCompensation / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} / month
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Base Salary ({isEditing && compensationInputMode === 'monthly' ? 'Monthly' : 'Annual'})
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="number"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {formData.baseSalary && parseFloat(formData.baseSalary) > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {compensationInputMode === 'monthly'
                          ? `≈ ${currency} ${(parseFloat(formData.baseSalary) * 12).toLocaleString()} annually`
                          : `≈ ${currency} ${(parseFloat(formData.baseSalary) / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} monthly`}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                      {currentEmployee.annualSalary
                        ? `${currency} ${currentEmployee.annualSalary.toLocaleString()} / year`
                        : 'N/A'}
                    </p>
                    {currentEmployee.annualSalary && (
                      <p className="mt-1 text-xs text-gray-500">
                        {currency} {(currentEmployee.annualSalary / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} / month
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Bonus ({isEditing && compensationInputMode === 'monthly' ? 'Monthly' : 'Annual'})
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                    {currentEmployee.bonus
                      ? `${currency} ${currentEmployee.bonus.toLocaleString()} / year`
                      : 'N/A'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Equity Value ({isEditing && compensationInputMode === 'monthly' ? 'Monthly' : 'Annual'})
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.equityValue}
                    onChange={(e) => setFormData({ ...formData, equityValue: e.target.value })}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
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
