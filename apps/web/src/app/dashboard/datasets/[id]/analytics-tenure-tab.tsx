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
  // Strategy: Use both manager relationships (if available) AND level-based detection
  const managersWithReports = employees.filter(emp =>
    employees.some(e => e.managerId === emp.id)
  );

  // Also detect managers by their level, even without manager relationships
  const managementLevels = ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'];
  const managementByLevel = employees.filter(emp =>
    emp.level && managementLevels.includes(emp.level)
  );

  // Combine both approaches (deduplicate by ID)
  const allManagers = [...new Map(
    [...managersWithReports, ...managementByLevel].map(emp => [emp.id, emp])
  ).values()];

  // Calculate span of control for each manager
  const spanOfControlData = allManagers.map(mgr => {
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

  // Calculate span by management level
  const spanByLevel = {
    MANAGER: spanOfControlData.filter(m => m.level === 'MANAGER'),
    DIRECTOR: spanOfControlData.filter(m => m.level === 'DIRECTOR'),
    VP: spanOfControlData.filter(m => m.level === 'VP'),
    C_LEVEL: spanOfControlData.filter(m => m.level === 'C_LEVEL'),
  };

  const avgSpanByLevel = {
    MANAGER: spanByLevel.MANAGER.length > 0
      ? spanByLevel.MANAGER.reduce((sum, m) => sum + m.directReportsCount, 0) / spanByLevel.MANAGER.length
      : 0,
    DIRECTOR: spanByLevel.DIRECTOR.length > 0
      ? spanByLevel.DIRECTOR.reduce((sum, m) => sum + m.directReportsCount, 0) / spanByLevel.DIRECTOR.length
      : 0,
    VP: spanByLevel.VP.length > 0
      ? spanByLevel.VP.reduce((sum, m) => sum + m.directReportsCount, 0) / spanByLevel.VP.length
      : 0,
    C_LEVEL: spanByLevel.C_LEVEL.length > 0
      ? spanByLevel.C_LEVEL.reduce((sum, m) => sum + m.directReportsCount, 0) / spanByLevel.C_LEVEL.length
      : 0,
  };

  const avgSpanOfControl = spanOfControlData.length > 0
    ? spanOfControlData.reduce((sum, mgr) => sum + mgr.directReportsCount, 0) / spanOfControlData.length
    : 0;

  const lowSpanManagers = spanOfControlData.filter(mgr => mgr.directReportsCount < 5);
  const highSpanManagers = spanOfControlData.filter(mgr => mgr.directReportsCount > 10);

  // Check if we have manager relationship data
  const hasManagerRelationships = employees.some(e => e.managerId);
  const managersWithoutReports = managementByLevel.filter(mgr =>
    !spanOfControlData.some(span => span.managerId === mgr.id)
  );

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
      {/* Warning if no manager relationships */}
      {!hasManagerRelationships && managementByLevel.length > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">
                Limited span of control data
              </p>
              <p className="mt-1 text-sm text-blue-700">
                We detected {managementByLevel.length} employees with management levels, but no manager relationships.
                Add the "Manager ID" field to your dataset to see detailed span of control metrics for each manager.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning if no managers detected at all */}
      {allManagers.length === 0 && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">No managers detected in your dataset</p>
              <p className="mt-1 text-sm text-yellow-700">
                Add employee level data (Manager, Director, VP, C-Level) or manager relationships
                to see span of control metrics.
              </p>
            </div>
          </div>
        </div>
      )}

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
            {allManagers.length}
          </p>
          <p className="text-sm text-gray-600">Total Managers</p>
          <p className="mt-1 text-xs text-gray-500">
            {totalEmployees > 0 ? ((allManagers.length / totalEmployees) * 100).toFixed(1) : '0.0'}% of workforce
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {allManagers.length > 0 ? (totalEmployees / allManagers.length).toFixed(1) : '—'}
          </p>
          <p className="text-sm text-gray-600">Employees per Manager</p>
          <p className="mt-1 text-xs text-gray-500">
            {allManagers.length > 0 ? 'Overall company ratio' : 'No managers found'}
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

      {/* Span of Control by Management Level */}
      {spanOfControlData.length > 0 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Span of Control by Management Level
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                key: 'C_LEVEL',
                label: 'C-Level',
                bgClass: 'bg-purple-50',
                borderClass: 'border-purple-200',
                textClass: 'text-purple-900',
                labelClass: 'text-purple-700',
                indicatorClass: 'text-purple-600'
              },
              {
                key: 'VP',
                label: 'VP',
                bgClass: 'bg-blue-50',
                borderClass: 'border-blue-200',
                textClass: 'text-blue-900',
                labelClass: 'text-blue-700',
                indicatorClass: 'text-blue-600'
              },
              {
                key: 'DIRECTOR',
                label: 'Director',
                bgClass: 'bg-indigo-50',
                borderClass: 'border-indigo-200',
                textClass: 'text-indigo-900',
                labelClass: 'text-indigo-700',
                indicatorClass: 'text-indigo-600'
              },
              {
                key: 'MANAGER',
                label: 'Manager',
                bgClass: 'bg-cyan-50',
                borderClass: 'border-cyan-200',
                textClass: 'text-cyan-900',
                labelClass: 'text-cyan-700',
                indicatorClass: 'text-cyan-600'
              },
            ].map(({ key, label, bgClass, borderClass, textClass, labelClass, indicatorClass }) => {
              const count = spanByLevel[key as keyof typeof spanByLevel].length;
              const avg = avgSpanByLevel[key as keyof typeof avgSpanByLevel];

              if (count === 0) return null;

              return (
                <div key={key} className={`rounded-lg ${bgClass} border ${borderClass} p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-medium ${textClass}`}>{label}</p>
                    <p className={`text-xs ${labelClass}`}>{count} {count === 1 ? 'person' : 'people'}</p>
                  </div>
                  <p className={`text-3xl font-bold ${textClass}`}>{avg.toFixed(1)}</p>
                  <p className={`text-xs ${labelClass} mt-1`}>avg direct reports</p>
                  <div className="mt-2">
                    {avg < 3 && (
                      <p className={`text-xs ${indicatorClass}`}>⚠️ Low span</p>
                    )}
                    {avg >= 5 && avg <= 8 && (
                      <p className={`text-xs ${indicatorClass}`}>✓ Healthy range</p>
                    )}
                    {avg > 10 && (
                      <p className={`text-xs ${indicatorClass}`}>⚠️ High span</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {managersWithoutReports.length > 0 && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-700">
                <strong>{managersWithoutReports.length}</strong> employees with management titles have no direct reports tracked.
                {!hasManagerRelationships && ' Add manager relationships to see their span of control.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Span of Control Details */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Span of Control by Manager
        </h3>
        {spanOfControlData.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">No manager data available</p>
            <p className="text-xs text-gray-500">Add manager relationships to see span of control details</p>
          </div>
        ) : (
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
        )}

        {spanOfControlData.length > 0 && lowSpanManagers.length > 0 && (
          <div className="mt-6 rounded-lg bg-yellow-50 p-4">
            <p className="font-medium text-yellow-900">
              ⚠️ {lowSpanManagers.length} manager{lowSpanManagers.length > 1 ? 's' : ''} with low span of control (&lt; 5 reports)
            </p>
            <p className="mt-1 text-sm text-yellow-700">
              Consider consolidating teams or redistributing direct reports for better efficiency.
            </p>
          </div>
        )}

        {spanOfControlData.length > 0 && highSpanManagers.length > 0 && (
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
