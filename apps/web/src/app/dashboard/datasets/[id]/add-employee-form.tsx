'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';

interface AddEmployeeFormProps {
  datasetId: string;
}

export default function AddEmployeeForm({ datasetId }: AddEmployeeFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: '',
    email: '',
    department: '',
    role: '',
    level: '',
    employmentType: 'FTE',
    totalCompensation: '',
    startDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/datasets/${datasetId}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalCompensation: parseFloat(formData.totalCompensation),
        }),
      });

      if (!response.ok) throw new Error('Failed to add employee');

      // Reset form
      setFormData({
        employeeName: '',
        email: '',
        department: '',
        role: '',
        level: '',
        employmentType: 'FTE',
        totalCompensation: '',
        startDate: '',
      });
      setIsOpen(false);

      // Refresh the page to show new employee
      router.refresh();
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
      >
        <Plus className="h-5 w-5" />
        Add Employee
      </button>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Add New Employee</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Name */}
          <div>
            <label
              htmlFor="employeeName"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="employeeName"
              required
              value={formData.employeeName}
              onChange={(e) =>
                setFormData({ ...formData, employeeName: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Jane Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="jane@example.com"
            />
          </div>

          {/* Department */}
          <div>
            <label
              htmlFor="department"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Department <span className="text-red-500">*</span>
            </label>
            <select
              id="department"
              required
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select department...</option>
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
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="role"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Role
            </label>
            <input
              type="text"
              id="role"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Senior Software Engineer"
            />
          </div>

          {/* Level */}
          <div>
            <label
              htmlFor="level"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Level
            </label>
            <select
              id="level"
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
          </div>

          {/* Employment Type */}
          <div>
            <label
              htmlFor="employmentType"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Employment Type
            </label>
            <select
              id="employmentType"
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
          </div>

          {/* Total Compensation */}
          <div>
            <label
              htmlFor="totalCompensation"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Total Annual Compensation <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="totalCompensation"
              required
              value={formData.totalCompensation}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  totalCompensation: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="120000"
            />
            <p className="mt-1 text-xs text-gray-500">
              Include base salary + bonus + equity value
            </p>
          </div>

          {/* Start Date */}
          <div>
            <label
              htmlFor="startDate"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Start Date (Hire Date)
            </label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  startDate: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              For tenure analysis
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}
