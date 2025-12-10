'use client';

import { useState } from 'react';
import { Database, BarChart3, Upload, FileText, Clock, DollarSign } from 'lucide-react';
import BenchmarkSourcesTab from './benchmark-sources-tab';
import OrganizationalBenchmarksTab from './organizational-benchmarks-tab';
import CompensationBenchmarksTab from './compensation-benchmarks-tab';
import BulkImportTab from './bulk-import-tab';
import AuditLogTab from './audit-log-tab';
import PendingApprovalTab from './pending-approval-tab';

type AdminTabId = 'pending' | 'organizational' | 'compensation' | 'sources' | 'import' | 'audit';

interface BenchmarkAdminTabsProps {
  initialSources: any[];
  initialOrganizationalBenchmarks: any[];
  uniqueIndustries: string[];
  uniqueRegions: string[];
  uniqueCompanySizes: string[];
}

export default function BenchmarkAdminTabs({
  initialSources,
  initialOrganizationalBenchmarks,
  uniqueIndustries,
  uniqueRegions,
  uniqueCompanySizes,
}: BenchmarkAdminTabsProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>('pending');

  const tabs = [
    { id: 'pending' as AdminTabId, label: 'Pending Approval', icon: Clock },
    { id: 'compensation' as AdminTabId, label: 'Compensation Benchmarks', icon: DollarSign },
    { id: 'organizational' as AdminTabId, label: 'Organizational Benchmarks', icon: BarChart3 },
    { id: 'sources' as AdminTabId, label: 'Data Sources', icon: Database },
    { id: 'import' as AdminTabId, label: 'Bulk Import', icon: Upload },
    { id: 'audit' as AdminTabId, label: 'Audit Log', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        {activeTab === 'pending' && <PendingApprovalTab />}
        {activeTab === 'compensation' && <CompensationBenchmarksTab />}
        {activeTab === 'organizational' && (
          <OrganizationalBenchmarksTab
            initialBenchmarks={initialOrganizationalBenchmarks}
            sources={initialSources}
            uniqueIndustries={uniqueIndustries}
            uniqueRegions={uniqueRegions}
            uniqueCompanySizes={uniqueCompanySizes}
          />
        )}
        {activeTab === 'sources' && (
          <BenchmarkSourcesTab initialSources={initialSources} />
        )}
        {activeTab === 'import' && (
          <BulkImportTab sources={initialSources} />
        )}
        {activeTab === 'audit' && <AuditLogTab />}
      </div>
    </div>
  );
}
