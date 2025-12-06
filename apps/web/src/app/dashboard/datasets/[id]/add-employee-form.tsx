'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import EmployeeDetailModal from './employee-detail-modal';

interface AddEmployeeFormProps {
  datasetId: string;
  currency: string;
}

export default function AddEmployeeForm({ datasetId, currency }: AddEmployeeFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
      >
        <Plus className="h-5 w-5" />
        Add Employee
      </button>

      <EmployeeDetailModal
        mode="add"
        datasetId={datasetId}
        currency={currency}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
