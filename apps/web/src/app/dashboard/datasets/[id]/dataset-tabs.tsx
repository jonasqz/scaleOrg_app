'use client';

import { useState } from 'react';
import { Users, BarChart3, TrendingUp, GitCompare, Upload } from 'lucide-react';
import AddEmployeeForm from './add-employee-form';
import CSVUpload from './csv-upload';
import EmployeeListClient from './employee-list-client';
import MetricsCharts from './metrics-charts';
import BenchmarkComparison from './benchmark-comparison';
import OutliersDisplay from './outliers-display';
import TenureDisplay from './tenure-display';
import InsightsDisplay from './insights-display';
import ScenarioBuilder from './scenario-builder';

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

interface DatasetTabsProps {
  datasetId: string;
  currency: string;
  employees: Employee[];
  metrics: any;
}

type TabId = 'overview' | 'employees' | 'analytics' | 'scenarios';

export default function DatasetTabs({
  datasetId,
  currency,
  employees,
  metrics,
}: DatasetTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview', icon: BarChart3 },
    { id: 'employees' as TabId, label: 'Employees', icon: Users },
    { id: 'analytics' as TabId, label: 'Analytics & Insights', icon: TrendingUp },
    { id: 'scenarios' as TabId, label: 'Scenarios', icon: GitCompare },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
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
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metrics Overview */}
            {metrics && (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="mt-4 text-2xl font-bold text-gray-900">
                    {metrics.summary.totalFTE.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Total FTE</p>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-2xl font-bold text-gray-900">
                    {currency} {(metrics.summary.totalCost / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-sm text-gray-600">Total Cost</p>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="mt-4 text-2xl font-bold text-gray-900">
                    {metrics.ratios.rdToGTM.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">R&D:GTM Ratio</p>
                </div>

                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="mt-4 text-2xl font-bold text-gray-900">
                    {metrics.ratios.avgSpanOfControl.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Avg Span of Control</p>
                </div>
              </div>
            )}

            {/* Department Breakdown */}
            {metrics && (
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Department Breakdown
                </h2>
                <div className="space-y-3">
                  {Object.entries(metrics.departments).map(([dept, data]: [string, any]) => (
                    <div
                      key={dept}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{dept}</p>
                        <p className="text-sm text-gray-600">
                          {data.fte.toFixed(1)} FTE · {data.employeeCount} employees
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {currency} {(data.cost / 1000).toFixed(0)}k
                        </p>
                        <p className="text-sm text-gray-600">
                          {data.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="rounded-lg border bg-blue-50 p-6">
              <h3 className="mb-2 text-sm font-semibold text-blue-900">Quick Actions</h3>
              <p className="mb-4 text-sm text-blue-700">
                Navigate to different sections using the tabs above
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('employees')}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Manage Employees
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  View Analytics
                </button>
                <button
                  onClick={() => setActiveTab('scenarios')}
                  className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Run Scenarios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <AddEmployeeForm datasetId={datasetId} />
              <CSVUpload datasetId={datasetId} />
            </div>

            {/* Employees List */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Employees ({employees.length})
                </h2>
              </div>

              {employees.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-500">No employees yet.</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Add your first employee above or import from CSV
                  </p>
                </div>
              ) : (
                <EmployeeListClient
                  employees={employees}
                  datasetId={datasetId}
                  currency={currency}
                />
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Visualizations */}
            {metrics && employees.length >= 3 && (
              <MetricsCharts
                departments={metrics.departments}
                currency={currency}
              />
            )}

            {/* Benchmark Comparison */}
            {metrics && employees.length >= 3 && (
              <BenchmarkComparison
                datasetId={datasetId}
                currency={currency}
              />
            )}

            {/* Outlier Detection */}
            {employees.length >= 5 && (
              <OutliersDisplay
                employees={employees}
                currency={currency}
              />
            )}

            {/* Tenure Analysis */}
            {metrics?.tenure && (
              <TenureDisplay tenure={metrics.tenure} />
            )}

            {/* AI-Powered Insights */}
            {metrics && employees.length >= 3 && (
              <InsightsDisplay
                metrics={metrics}
                currency={currency}
              />
            )}

            {employees.length < 3 && (
              <div className="rounded-lg border bg-yellow-50 p-8 text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-yellow-600" />
                <p className="mt-4 font-medium text-yellow-900">
                  Need more data for analytics
                </p>
                <p className="mt-1 text-sm text-yellow-700">
                  Add at least 3 employees to see analytics and insights
                </p>
                <button
                  onClick={() => setActiveTab('employees')}
                  className="mt-4 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                >
                  Go to Employees
                </button>
              </div>
            )}
          </div>
        )}

        {/* Scenarios Tab */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            {metrics ? (
              <>
                <div className="rounded-lg border bg-purple-50 p-6">
                  <h2 className="mb-2 text-lg font-semibold text-purple-900">
                    Scenario Modeling
                  </h2>
                  <p className="text-sm text-purple-700">
                    Run what-if analyses to understand the impact of workforce changes on your
                    metrics. Model hiring freezes, cost reductions, growth plans, and more.
                  </p>
                </div>

                <ScenarioBuilder
                  datasetId={datasetId}
                  currency={currency}
                  currentMetrics={{
                    totalFTE: metrics.summary.totalFTE,
                    totalCost: metrics.summary.totalCost,
                    employeeCount: metrics.summary.employeeCount,
                    rdToGTM: metrics.ratios.rdToGTM,
                  }}
                  departments={metrics.departments}
                />
              </>
            ) : (
              <div className="rounded-lg border bg-gray-50 p-8 text-center">
                <GitCompare className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 font-medium text-gray-900">
                  No data available for scenarios
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Add employees first to run scenario analyses
                </p>
                <button
                  onClick={() => setActiveTab('employees')}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Go to Employees
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
