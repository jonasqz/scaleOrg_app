'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Trash2, Calendar, Mail, Briefcase, DollarSign, User, Plus } from 'lucide-react';

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
  employee?: Employee; // Optional for add mode
  datasetId: string;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'view' | 'add'; // 'view' for existing employee, 'add' for new
  allEmployees?: Employee[]; // For extracting existing departments/locations
}

const emptyEmployee = {
  id: '',
  employeeName: '',
  email: '',
  department: '',
  role: '',
  level: '',
  employmentType: 'FTE',
  totalCompensation: 0,
  baseSalary: null,
  bonus: null,
  equityValue: null,
  fteFactor: 1,
  startDate: null,
  location: '',
  managerId: null,
  costCenter: '',
};

export default function EmployeeDetailModal({
  employee,
  datasetId,
  currency,
  isOpen,
  onClose,
  mode = 'view',
  allEmployees = [],
}: EmployeeDetailModalProps) {
  const router = useRouter();
  const isAddMode = mode === 'add';
  const [isEditing, setIsEditing] = useState(isAddMode);
  const [loading, setLoading] = useState(false);

  const currentEmployee = employee || emptyEmployee;

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

  const [formData, setFormData] = useState({
    employeeName: currentEmployee.employeeName || '',
    email: currentEmployee.email || '',
    department: currentEmployee.department,
    role: currentEmployee.role || '',
    level: currentEmployee.level || '',
    employmentType: currentEmployee.employmentType,
    totalCompensation: currentEmployee.totalCompensation.toString(),
    baseSalary: currentEmployee.baseSalary?.toString() || '',
    bonus: currentEmployee.bonus?.toString() || '',
    equityValue: currentEmployee.equityValue?.toString() || '',
    fteFactor: currentEmployee.fteFactor.toString(),
    startDate: currentEmployee.startDate
      ? new Date(currentEmployee.startDate).toISOString().split('T')[0]
      : '',
    location: currentEmployee.location || '',
    costCenter: currentEmployee.costCenter || '',
  });

  // Reset form when employee changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const emp = employee || emptyEmployee;
      setFormData({
        employeeName: emp.employeeName || '',
        email: emp.email || '',
        department: emp.department,
        role: emp.role || '',
        level: emp.level || '',
        employmentType: emp.employmentType,
        totalCompensation: emp.totalCompensation.toString(),
        baseSalary: emp.baseSalary?.toString() || '',
        bonus: emp.bonus?.toString() || '',
        equityValue: emp.equityValue?.toString() || '',
        fteFactor: emp.fteFactor.toString(),
        startDate: emp.startDate
          ? new Date(emp.startDate).toISOString().split('T')[0]
          : '',
        location: emp.location || '',
        costCenter: emp.costCenter || '',
      });
      setIsEditing(isAddMode);
      setShowNewDepartment(false);
      setShowNewLocation(false);
    }
  }, [employee, isOpen, isAddMode]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        totalCompensation: parseFloat(formData.totalCompensation),
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : null,
        bonus: formData.bonus ? parseFloat(formData.bonus) : null,
        equityValue: formData.equityValue ? parseFloat(formData.equityValue) : null,
        fteFactor: parseFloat(formData.fteFactor),
      };

      if (isAddMode) {
        // Create new employee
        const response = await fetch(`/api/datasets/${datasetId}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to add employee');

        onClose();
        router.refresh();
      } else {
        // Update existing employee
        const response = await fetch(
          `/api/datasets/${datasetId}/employees/${currentEmployee.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) throw new Error('Failed to update employee');

        onClose();
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(isAddMode ? 'Failed to add employee' : 'Failed to update employee');
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
    if (!currentEmployee.startDate) return null;
    const start = new Date(currentEmployee.startDate);
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
                  {isAddMode
                    ? 'Add New Employee'
                    : currentEmployee.employeeName || 'Unnamed Employee'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isAddMode
                    ? 'Fill in employee details'
                    : currentEmployee.role || currentEmployee.department}
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
            {/* Quick Stats - Only show in view mode */}
            {!isAddMode && (
              <div className="mb-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <DollarSign className="h-4 w-4" />
                    <span>Total Compensation</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {currency} {currentEmployee.totalCompensation.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Briefcase className="h-4 w-4" />
                    <span>Department</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {currentEmployee.department}
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
                    {currentEmployee.employmentType}
                  </p>
                </div>
              </div>
            )}

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
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {currentEmployee.email || 'N/A'}
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
                        {currentEmployee.startDate
                          ? new Date(currentEmployee.startDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    {isEditing ? (
                      showNewLocation ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({ ...formData, location: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                setShowNewLocation(false);
                              } else if (e.key === 'Escape') {
                                setShowNewLocation(false);
                                if (!formData.location && existingLocations.length > 0) {
                                  setFormData({ ...formData, location: existingLocations[0] });
                                }
                              }
                            }}
                            placeholder="Enter new location (e.g., San Francisco, CA)"
                            className="flex-1 rounded-lg border border-blue-500 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewLocation(false);
                            }}
                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <select
                            value={formData.location || ''}
                            onChange={(e) => {
                              if (e.target.value === '__create_new__') {
                                setShowNewLocation(true);
                              } else {
                                setFormData({ ...formData, location: e.target.value });
                              }
                            }}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select location...</option>
                            {existingLocations.map((loc) => (
                              <option key={loc} value={loc}>
                                {loc}
                              </option>
                            ))}
                            {formData.location && !existingLocations.includes(formData.location) && (
                              <option value={formData.location}>
                                {formData.location}
                              </option>
                            )}
                            <option value="__create_new__" className="font-medium text-blue-600">
                              + Create new location
                            </option>
                          </select>
                        </div>
                      )
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {currentEmployee.location || 'N/A'}
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
                      showNewDepartment ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.department}
                            onChange={(e) =>
                              setFormData({ ...formData, department: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                setShowNewDepartment(false);
                              } else if (e.key === 'Escape') {
                                setShowNewDepartment(false);
                                if (!formData.department && existingDepartments.length > 0) {
                                  setFormData({ ...formData, department: existingDepartments[0] });
                                }
                              }
                            }}
                            placeholder="Enter new department"
                            className="flex-1 rounded-lg border border-blue-500 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewDepartment(false);
                            }}
                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <select
                            value={formData.department}
                            onChange={(e) => {
                              if (e.target.value === '__create_new__') {
                                setShowNewDepartment(true);
                              } else {
                                setFormData({ ...formData, department: e.target.value });
                              }
                            }}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {existingDepartments.length === 0 && (
                              <>
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
                              </>
                            )}
                            {existingDepartments.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                            {formData.department && !existingDepartments.includes(formData.department) && existingDepartments.length > 0 && (
                              <option value={formData.department}>
                                {formData.department}
                              </option>
                            )}
                            <option value="__create_new__" className="font-medium text-blue-600">
                              + Create new department
                            </option>
                          </select>
                        </div>
                      )
                    ) : (
                      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900">
                        {currentEmployee.department}
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
                        {currentEmployee.role || 'N/A'}
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
                        {currentEmployee.level || 'N/A'}
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
                        {currentEmployee.employmentType}
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
                        {currentEmployee.fteFactor}
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
                        {currentEmployee.costCenter || 'N/A'}
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
                        {currency} {currentEmployee.totalCompensation.toLocaleString()}
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
                        {currentEmployee.baseSalary
                          ? `${currency} ${currentEmployee.baseSalary.toLocaleString()}`
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
                        {currentEmployee.bonus
                          ? `${currency} ${currentEmployee.bonus.toLocaleString()}`
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
                        {currentEmployee.equityValue
                          ? `${currency} ${currentEmployee.equityValue.toLocaleString()}`
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
            {!isAddMode && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Employee
              </button>
            )}

            {isAddMode && <div />}

            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      if (isAddMode) {
                        onClose();
                      } else {
                        setIsEditing(false);
                      }
                    }}
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
                    {loading
                      ? isAddMode
                        ? 'Adding...'
                        : 'Saving...'
                      : isAddMode
                      ? 'Add Employee'
                      : 'Save Changes'}
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
