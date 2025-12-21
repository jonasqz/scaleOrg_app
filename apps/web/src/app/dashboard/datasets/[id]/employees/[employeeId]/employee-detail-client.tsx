'use client';

import { useState } from 'react';
import EmployeeDetailPageView from './employee-detail-page-view';
import EmployeeCompensationTab from './employee-compensation-tab';

interface EmployeeDetailClientProps {
  employee: any;
  datasetId: string;
  currency: string;
  allEmployees: any[];
  scenarios: any[];
}

export default function EmployeeDetailClient({
  employee,
  datasetId,
  currency,
  allEmployees,
  scenarios,
}: EmployeeDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'compensation'>('general');

  // Convert Prisma decimal/bigint to numbers
  const formattedEmployee = {
    ...employee,
    totalCompensation: Number(employee.totalCompensation),
    annualSalary: employee.annualSalary ? Number(employee.annualSalary) : null,
    bonus: employee.bonus ? Number(employee.bonus) : null,
    equityValue: employee.equityValue ? Number(employee.equityValue) : null,
    fteFactor: Number(employee.fteFactor),
    compensationTargets: employee.compensationTargets?.map((target: any) => ({
      ...target,
      targetAnnualComp: Number(target.targetAnnualComp),
    })) || [],
    monthlyPlannedCompensation: employee.monthlyPlannedCompensation?.map((mpc: any) => ({
      ...mpc,
      plannedTotalEmployerCost: Number(mpc.plannedTotalEmployerCost),
      plannedGrossTotal: Number(mpc.plannedGrossTotal),
    })) || [],
  };

  const formattedAllEmployees = allEmployees.map(emp => ({
    ...emp,
    totalCompensation: Number(emp.totalCompensation),
    annualSalary: emp.annualSalary ? Number(emp.annualSalary) : null,
    bonus: emp.bonus ? Number(emp.bonus) : null,
    equityValue: emp.equityValue ? Number(emp.equityValue) : null,
    fteFactor: Number(emp.fteFactor),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      {/* Tab Navigation */}
      <div className="border-b border-stone-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-xs font-medium transition-colors ${
              activeTab === 'general'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('compensation')}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-xs font-medium transition-colors ${
              activeTab === 'compensation'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            Compensation
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <EmployeeDetailPageView
          employee={formattedEmployee}
          datasetId={datasetId}
          currency={currency}
          allEmployees={formattedAllEmployees}
        />
      )}

      {activeTab === 'compensation' && (
        <EmployeeCompensationTab
          employee={formattedEmployee}
          datasetId={datasetId}
          currency={currency}
          scenarios={scenarios}
        />
      )}
    </div>
  );
}
