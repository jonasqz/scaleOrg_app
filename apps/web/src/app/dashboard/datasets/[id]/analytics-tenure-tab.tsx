'use client';

import TenureDisplay from './tenure-display';
import { Users, AlertTriangle, TrendingUp } from 'lucide-react';

interface AnalyticsTenureTabProps {
  datasetId: string;
  currency: string;
  employees: any[];
  metrics: any;
  dataset: any;
}

export default function AnalyticsTenureTab({
  datasetId,
  currency,
  employees,
  metrics,
  dataset,
}: AnalyticsTenureTabProps) {
  if (!metrics) {
    return <div>No metrics available</div>;
  }

  // Calculate span of control metrics
  const managers = employees.filter(emp =>
    employees.some(e => e.managerId === emp.id)
  );

  const spanOfControlData = managers.map(mgr => {
    const directReports = employees.filter(e => e.managerId === mgr.id);
    return {
      managerId: mgr.id,
      managerName: mgr.employeeName,
      department: mgr.department,
      role: mgr.role,
      level: mgr.level,
      directReportsCount: directReports.length,
    };
  }).filter(mgr => mgr.directReportsCount > 0);

  const avgSpanOfControl = spanOfControlData.length > 0
    ? spanOfControlData.reduce((sum, mgr) => sum + mgr.directReportsCount, 0) / spanOfControlData.length
    : 0;

  const lowSpanManagers = spanOfControlData.filter(mgr => mgr.directReportsCount < 5);
  const highSpanManagers = spanOfControlData.filter(mgr => mgr.directReportsCount > 10);

  // Calculate seniority distribution
  const seniorityDistribution = employees.reduce((acc: any, emp: any) => {
    const level = emp.level || 'Not Set';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  const totalEmployees = employees.length;

  // Calculate percentage of management vs IC
  const managementCount = employees.filter(emp =>
    emp.level && ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'].includes(emp.level)
  ).length;
  const icCount = employees.filter(emp => emp.level === 'IC').length;
  const notSetCount = employees.filter(emp => !emp.level).length;

  const managementPercentage = (managementCount / totalEmployees) * 100;
  const icPercentage = (icCount / totalEmployees) * 100;

  return (
    <div className="space-y-8">
      {/* Span of Control Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {avgSpanOfControl.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600">Avg Span of Control</p>
          <p className="mt-1 text-xs text-gray-500">
            Industry benchmark: 5-8 direct reports
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-purple-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {managers.length}
          </p>
          <p className="text-sm text-gray-600">Total Managers</p>
          <p className="mt-1 text-xs text-gray-500">
            {((managers.length / totalEmployees) * 100).toFixed(1)}% of workforce
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {(totalEmployees / managers.length).toFixed(1)}
          </p>
          <p className="text-sm text-gray-600">Employees per Manager</p>
          <p className="mt-1 text-xs text-gray-500">
            Overall company ratio
          </p>
        </div>
      </div>

      {/* Seniority Level Distribution */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Seniority Level Distribution
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(seniorityDistribution)
            .sort((a, b) => {
              const levelOrder: any = { 'IC': 1, 'MANAGER': 2, 'DIRECTOR': 3, 'VP': 4, 'C_LEVEL': 5, 'Not Set': 6 };
              return (levelOrder[a[0]] || 99) - (levelOrder[b[0]] || 99);
            })
            .map(([level, count]: [string, any]) => (
              <div key={level} className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {level === 'C_LEVEL' ? 'C-Level' : level}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((count / totalEmployees) * 100).toFixed(1)}%
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">employees</p>
              </div>
            ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-900 font-medium">Individual Contributors (IC)</p>
            <p className="mt-2 text-2xl font-bold text-blue-900">{icPercentage.toFixed(1)}%</p>
            <p className="text-xs text-blue-700">{icCount} employees</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-sm text-purple-900 font-medium">Management (M/D/VP/C)</p>
            <p className="mt-2 text-2xl font-bold text-purple-900">{managementPercentage.toFixed(1)}%</p>
            <p className="text-xs text-purple-700">{managementCount} employees</p>
          </div>
        </div>
      </div>

      {/* Span of Control Details */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Span of Control by Manager
        </h3>
        <div className="space-y-3">
          {spanOfControlData
            .sort((a, b) => b.directReportsCount - a.directReportsCount)
            .map((mgr) => (
              <div
                key={mgr.managerId}
                className={`flex items-center justify-between rounded-lg p-4 ${
                  mgr.directReportsCount < 5
                    ? 'bg-yellow-50 border border-yellow-200'
                    : mgr.directReportsCount > 10
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{mgr.managerName || 'Unnamed Manager'}</p>
                  <p className="text-sm text-gray-600">
                    {mgr.department} · {mgr.role || 'No role'} · {mgr.level || 'No level'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {mgr.directReportsCount < 5 && (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  {mgr.directReportsCount > 10 && (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {mgr.directReportsCount}
                    </p>
                    <p className="text-xs text-gray-500">direct reports</p>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {lowSpanManagers.length > 0 && (
          <div className="mt-6 rounded-lg bg-yellow-50 p-4">
            <p className="font-medium text-yellow-900">
              ⚠️ {lowSpanManagers.length} manager{lowSpanManagers.length > 1 ? 's' : ''} with low span of control (&lt; 5 reports)
            </p>
            <p className="mt-1 text-sm text-yellow-700">
              Consider consolidating teams or redistributing direct reports for better efficiency.
            </p>
          </div>
        )}

        {highSpanManagers.length > 0 && (
          <div className="mt-4 rounded-lg bg-orange-50 p-4">
            <p className="font-medium text-orange-900">
              ⚠️ {highSpanManagers.length} manager{highSpanManagers.length > 1 ? 's' : ''} with high span of control (&gt; 10 reports)
            </p>
            <p className="mt-1 text-sm text-orange-700">
              Consider adding middle management or splitting teams to reduce management burden.
            </p>
          </div>
        )}
      </div>

      {/* Tenure Analysis */}
      {metrics.tenure && (
        <TenureDisplay tenure={metrics.tenure} />
      )}

      {/* AI-Powered Insights */}
      <div className="rounded-lg border bg-blue-50 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          💡 Team Structure Insights
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          {avgSpanOfControl < 5 && (
            <li>• Your average span of control is below industry standard. Consider consolidating management layers.</li>
          )}
          {avgSpanOfControl > 8 && (
            <li>• Your average span of control is above industry standard. Consider adding more managers.</li>
          )}
          {managementPercentage > 30 && (
            <li>• Management makes up {managementPercentage.toFixed(1)}% of your workforce, which is high. Consider flattening the organization.</li>
          )}
          {icPercentage > 70 && (
            <li>• {icPercentage.toFixed(1)}% of your workforce are individual contributors. This is a flat structure.</li>
          )}
          {notSetCount > 0 && (
            <li>• {notSetCount} employees don't have a level set. Consider adding this data for better insights.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
