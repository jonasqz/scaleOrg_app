'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import EmployeeDetailModal from './employee-detail-modal';

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

interface AddEmployeeFormProps {
  datasetId: string;
  currency: string;
  allEmployees?: Employee[];
}

export default function AddEmployeeForm({ datasetId, currency, allEmployees = [] }: AddEmployeeFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Employee
      </button>

      <EmployeeDetailModal
        mode="add"
        datasetId={datasetId}
        currency={currency}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        allEmployees={allEmployees}
      />
    </>
  );
}
