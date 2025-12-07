'use client';

import { useState } from 'react';
import { Settings, Tag } from 'lucide-react';
import SettingsGeneralTab from './settings-general-tab';
import SettingsDepartmentsTab from './settings-departments-tab';

interface SettingsTabsProps {
  datasetId: string;
  dataset: any;
}

type SettingsTabId = 'general' | 'departments';

export default function SettingsTabs({ datasetId, dataset }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');

  const tabs = [
    { id: 'general' as SettingsTabId, label: 'General', icon: Settings },
    { id: 'departments' as SettingsTabId, label: 'Department Categorization', icon: Tag },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
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

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && (
          <SettingsGeneralTab datasetId={datasetId} dataset={dataset} />
        )}

        {activeTab === 'departments' && (
          <SettingsDepartmentsTab datasetId={datasetId} />
        )}
      </div>
    </div>
  );
}
