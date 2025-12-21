'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Settings, Tag, TrendingUp } from 'lucide-react';
import SettingsGeneralTab from './settings-general-tab';
import SettingsDepartmentsTab from './settings-departments-tab';
import SettingsKPIsTab from './settings-kpis-tab';

interface SettingsTabsProps {
  datasetId: string;
  dataset: any;
}

type SettingsTabId = 'general' | 'departments' | 'kpis';

export default function SettingsTabs({ datasetId, dataset }: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTabId | null;

  const [activeTab, setActiveTab] = useState<SettingsTabId>(
    tabParam && ['general', 'departments', 'kpis'].includes(tabParam) ? tabParam : 'general'
  );

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam && ['general', 'departments', 'kpis'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const tabs = [
    { id: 'general' as SettingsTabId, label: 'General', icon: Settings },
    { id: 'departments' as SettingsTabId, label: 'Department Categorization', icon: Tag },
    { id: 'kpis' as SettingsTabId, label: 'KPI Dashboard', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-stone-200">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && (
          <SettingsGeneralTab datasetId={datasetId} dataset={dataset} />
        )}

        {activeTab === 'departments' && (
          <SettingsDepartmentsTab datasetId={datasetId} />
        )}

        {activeTab === 'kpis' && (
          <SettingsKPIsTab datasetId={datasetId} />
        )}
      </div>
    </div>
  );
}
