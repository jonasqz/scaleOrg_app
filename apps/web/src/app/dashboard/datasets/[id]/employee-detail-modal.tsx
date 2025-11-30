'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Trash2, Calendar, Mail, Briefcase, DollarSign, User } from 'lucide-react';

interface Employee {
  id: string;
  employeeName: string | null;
  email: string | null;
  department: string;
  role: string | null;
  level: string | null;
  employmentType: string;
  totalCompensation: number;
  baseSalary: number | null;
  bonus: number | null;
  equityValue: number | null;
  fteFactor: number;
  startDate: Date | null;
  location: string | null;
  managerId: string | null;
  costCenter: string | null;
}

interface EmployeeDetailModalProps {
  employee: Employee;
  datasetId: string;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeDetailModal({
  employee,
  datasetId,
  currency,
  isOpen,
  onClose,
}: EmployeeDetailModalProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: employee.employeeName || '',
    email: employee.email || '',
    department: employee.department,
    role: employee.role || '',
    level: employee.level || '',
    employmentType: employee.employmentType,
    totalCompensation: employee.totalCompensation.toString(),
    baseSalary: employee.baseSalary?.toString() || '',
    bonus: employee.bonus?.toString() || '',
    equityValue: employee.equityValue?.toString() || '',
    fteFactor: employee.fteFactor.toString(),
    startDate: employee.startDate
      ? new Date(employee.startDate).toISOString().split('T')[0]
      : '',
    location: employee.location || '',
    costCenter: employee.costCenter || '',
  });

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/datasets/${datasetId}/employees/${employee.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            totalCompensation: parseFloat(formData.totalCompensation),
            baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : null,
            bonus: formData.bonus ? parseFloat(formData.bonus) : null,
            equityValue: formData.equityValue ? parseFloat(formData.equityValue) : null,
            fteFactor: parseFloat(formData.fteFactor),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update employee');

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${employee.employeeName || 'this employee'}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/datasets/${datasetId}/employees/${employee.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to delete employee');

      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  const calculateTenure = () => {
    if (!employee.startDate) return null;
    const start = new Date(employee.startDate);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years}y ${remainingMonths}m`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {employee.employeeName || 'Unnamed Employee'}
                </h2>
                <p className="text-sm text-gray-500">
                  {employee.role || employee.department}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Quick Stats */}
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Compensation</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {currency} {employee.totalCompensation.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Briefcase className="h-4 w-4" />
                  <span>Department</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {employee.department}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Tenure</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {calculateTenure() || 'N/A'}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="h-4 w-4" />
                  <span>Employment Type</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {employee.employmentType}
                </p>
              </div>
            </div>

            {/* Main Form */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.employeeName}
                        onChange={(e) =>
                          setFormData({ ...formData, employeeName: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.employeeName || 'N/A'}
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
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.email || 'N/A'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Start Date (Hire Date)
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({ ...formData, startDate: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.startDate
                          ? new Date(employee.startDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="San Francisco, CA"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.location || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Employment Details
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({ ...formData, department: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product</option>
                        <option value="Design">Design</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Customer Success">Customer Success</option>
                        <option value="Finance">Finance</option>
                        <option value="HR">HR</option>
                        <option value="Legal">Legal</option>
                        <option value="Operations">Operations</option>
                      </select>
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.department}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Role / Title
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Senior Software Engineer"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.role || 'N/A'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Level
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.level}
                        onChange={(e) =>
                          setFormData({ ...formData, level: e.target.value })
                        }
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
                        {employee.level || 'N/A'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Employment Type
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.employmentType}
                        onChange={(e) =>
                          setFormData({ ...formData, employmentType: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="FTE">FTE (Full-time)</option>
                        <option value="CONTRACTOR">Contractor</option>
                        <option value="PART_TIME">Part-time</option>
                        <option value="INTERN">Intern</option>
                      </select>
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.employmentType}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      FTE Factor
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={formData.fteFactor}
                        onChange={(e) =>
                          setFormData({ ...formData, fteFactor: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.fteFactor}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Cost Center
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.costCenter}
                        onChange={(e) =>
                          setFormData({ ...formData, costCenter: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="CC-1001"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.costCenter || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Compensation Breakdown
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Total Annual Compensation
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.totalCompensation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalCompensation: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {currency} {employee.totalCompensation.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Base Salary
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.baseSalary}
                        onChange={(e) =>
                          setFormData({ ...formData, baseSalary: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.baseSalary
                          ? `${currency} ${employee.baseSalary.toLocaleString()}`
                          : 'N/A'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Bonus
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.bonus}
                        onChange={(e) =>
                          setFormData({ ...formData, bonus: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.bonus
                          ? `${currency} ${employee.bonus.toLocaleString()}`
                          : 'N/A'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Equity Value (Annual)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.equityValue}
                        onChange={(e) =>
                          setFormData({ ...formData, equityValue: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {employee.equityValue
                          ? `${currency} ${employee.equityValue.toLocaleString()}`
                          : 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 flex items-center justify-between border-t bg-white px-6 py-4">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Employee
            </button>

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
                    onClick={handleUpdate}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Edit Employee
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
