'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, X, Save, Eye } from 'lucide-react';

interface EmployeeRowProps {
  employee: {
    id: string;
    employeeName: string | null;
    email: string | null;
    department: string;
    role: string | null;
    level: string | null;
    employmentType: string;
    totalCompensation: any;
    startDate: Date | null;
  };
  datasetId: string;
  currency: string;
  onOpenDetail?: () => void;
}

export default function EmployeeRow({ employee, datasetId, currency, onOpenDetail }: EmployeeRowProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: employee.employeeName || '',
    email: employee.email || '',
    department: employee.department,
    role: employee.role || '',
    level: employee.level || '',
    employmentType: employee.employmentType,
    totalCompensation: employee.totalCompensation.toString(),
    startDate: employee.startDate ? new Date(employee.startDate).toISOString().split('T')[0] : '',
  });

  const handleUpdate = async () => {
    try {
      const response = await fetch(
        `/api/datasets/${datasetId}/employees/${employee.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            totalCompensation: parseFloat(formData.totalCompensation),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update employee');

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${employee.employeeName || 'this employee'}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/datasets/${datasetId}/employees/${employee.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to delete employee');

      router.refresh();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-3">
          <input
            type="text"
            value={formData.employeeName}
            onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Name"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
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
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Role"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select...</option>
            <option value="IC">IC</option>
            <option value="MANAGER">Manager</option>
            <option value="DIRECTOR">Director</option>
            <option value="VP">VP</option>
            <option value="C_LEVEL">C-Level</option>
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            value={formData.totalCompensation}
            onChange={(e) => setFormData({ ...formData, totalCompensation: e.target.value })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Compensation"
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpdate}
              className="rounded bg-green-600 p-1.5 text-white hover:bg-green-700"
              title="Save changes"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded bg-gray-600 p-1.5 text-white hover:bg-gray-700"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        {employee.employeeName || 'Unnamed'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {employee.department}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {employee.role || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {employee.level || '-'}
      </td>
      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
        {currency} {Number(employee.totalCompensation).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {onOpenDetail && (
            <button
              onClick={onOpenDetail}
              className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
            title="Quick edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
            title="Delete employee"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
