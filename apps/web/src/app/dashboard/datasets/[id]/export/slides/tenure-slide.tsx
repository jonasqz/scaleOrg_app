import React from 'react';
import { Users, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { BrandingConfig } from '@/lib/export-types';

interface TenureSlideProps {
  employees: any[];
  metrics: any;
  branding: BrandingConfig;
}

function calculateTenureMetrics(employees: any[]) {
  // Calculate average tenure in months
  const employeesWithStartDate = employees.filter(e => e.startDate);
  const now = new Date();

  const tenureMonths = employeesWithStartDate.map(e => {
    const startDate = new Date(e.startDate);
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  });

  const avgTenureMonths = tenureMonths.length > 0
    ? tenureMonths.reduce((sum, t) => sum + t, 0) / tenureMonths.length
    : 0;

  // Group by tenure buckets
  const buckets = {
    '<6m': tenureMonths.filter(t => t < 6).length,
    '6-12m': tenureMonths.filter(t => t >= 6 && t < 12).length,
    '1-2y': tenureMonths.filter(t => t >= 12 && t < 24).length,
    '2-3y': tenureMonths.filter(t => t >= 24 && t < 36).length,
    '3-5y': tenureMonths.filter(t => t >= 36 && t < 60).length,
    '5y+': tenureMonths.filter(t => t >= 60).length,
  };

  // Calculate span of control metrics
  const managersWithReports = employees.filter(emp =>
    employees.some(e => e.managerId === emp.id)
  );

  const managementLevels = ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'];
  const managementByLevel = employees.filter(emp =>
    emp.level && managementLevels.includes(emp.level)
  );

  const allManagers = [...new Map(
    [...managersWithReports, ...managementByLevel].map(emp => [emp.id, emp])
  ).values()];

  const spanOfControlData = allManagers.map(mgr => {
    const directReports = employees.filter(e => e.managerId === mgr.id);
    return {
      managerId: mgr.id,
      managerName: mgr.employeeName,
      level: mgr.level,
      directReportsCount: directReports.length,
    };
  }).filter(mgr => mgr.directReportsCount > 0);

  const avgSpanOfControl = spanOfControlData.length > 0
    ? spanOfControlData.reduce((sum, mgr) => sum + mgr.directReportsCount, 0) / spanOfControlData.length
    : 0;

  // Calculate seniority distribution
  const managementCount = employees.filter(emp =>
    emp.level && ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'].includes(emp.level)
  ).length;
  const icCount = employees.filter(emp => emp.level === 'IC').length;

  return {
    avgTenureMonths,
    buckets,
    managementCount,
    icCount,
    avgSpanOfControl,
    totalManagers: allManagers.length,
    employeesPerManager: allManagers.length > 0 ? employees.length / allManagers.length : 0,
  };
}

export function TenureSlide({ employees, metrics, branding }: TenureSlideProps) {
  const tenureMetrics = calculateTenureMetrics(employees);
  const totalEmployees = employees.length;

  const avgTenureYears = tenureMetrics.avgTenureMonths / 12;
  const managementPercentage = (tenureMetrics.managementCount / totalEmployees) * 100;
  const icPercentage = (tenureMetrics.icCount / totalEmployees) * 100;

  return (
    <div className="flex h-[768px] w-[1024px] flex-col bg-white print:break-after-page">
      {/* Header */}
      <div
        className="border-b p-8"
        style={{ borderColor: branding.primaryColor + '20' }}
      >
        <h1
          className="text-3xl font-bold"
          style={{ color: branding.primaryColor }}
        >
          Tenure & Organizational Structure
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Employee tenure distribution and management structure analysis
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Tenure Metrics */}
          <div className="space-y-6">
            {/* Average Tenure */}
            <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-orange-600" />
                <h3 className="font-semibold text-gray-800">Average Tenure</h3>
              </div>
              <div className="mt-4 text-5xl font-bold text-orange-900">
                {avgTenureYears.toFixed(1)}y
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {tenureMetrics.avgTenureMonths.toFixed(0)} months average
              </p>
            </div>

            {/* Tenure Distribution */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Tenure Distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(tenureMetrics.buckets).map(([label, count]) => {
                  const percentage = (count / totalEmployees) * 100;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-16 text-xs text-gray-600">{label}</div>
                      <div className="flex-1">
                        <div className="h-8 rounded-lg bg-gray-100">
                          <div
                            className="h-8 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-end px-2"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          >
                            <span className="text-xs font-medium text-white">
                              {count}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-12 text-right text-xs text-gray-600">
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seniority Split */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                IC vs Management
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="text-xs text-blue-900 font-medium">
                    Individual Contributors
                  </div>
                  <div className="mt-2 text-3xl font-bold text-blue-900">
                    {icPercentage.toFixed(0)}%
                  </div>
                  <div className="mt-1 text-xs text-blue-700">
                    {tenureMetrics.icCount} employees
                  </div>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <div className="text-xs text-purple-900 font-medium">
                    Management
                  </div>
                  <div className="mt-2 text-3xl font-bold text-purple-900">
                    {managementPercentage.toFixed(0)}%
                  </div>
                  <div className="mt-1 text-xs text-purple-700">
                    {tenureMetrics.managementCount} employees
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Management Structure */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Management Structure
            </h3>

            {/* Span of Control Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <Users className="h-5 w-5 text-orange-600" />
                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {tenureMetrics.avgSpanOfControl.toFixed(1)}
                </p>
                <p className="text-xs text-gray-600">Avg Span</p>
                <p className="mt-1 text-[10px] text-gray-500">
                  Benchmark: 5-8
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <Users className="h-5 w-5 text-orange-500" />
                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {tenureMetrics.totalManagers}
                </p>
                <p className="text-xs text-gray-600">Managers</p>
                <p className="mt-1 text-[10px] text-gray-500">
                  {totalEmployees > 0 ? ((tenureMetrics.totalManagers / totalEmployees) * 100).toFixed(1) : '0'}% of workforce
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {tenureMetrics.employeesPerManager.toFixed(1)}
                </p>
                <p className="text-xs text-gray-600">Emp/Manager</p>
                <p className="mt-1 text-[10px] text-gray-500">
                  Company ratio
                </p>
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Key Insights</h4>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  {avgTenureYears < 1.5 ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">Tenure Health</h5>
                    <p className="mt-1 text-xs text-gray-600">
                      {avgTenureYears < 1.5
                        ? `Average tenure of ${avgTenureYears.toFixed(1)} years suggests high turnover or rapid growth. Monitor retention strategies.`
                        : `Healthy average tenure of ${avgTenureYears.toFixed(1)} years indicates good retention.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  {tenureMetrics.avgSpanOfControl < 5 || tenureMetrics.avgSpanOfControl > 8 ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">Span of Control</h5>
                    <p className="mt-1 text-xs text-gray-600">
                      {tenureMetrics.avgSpanOfControl < 5
                        ? `Low span of ${tenureMetrics.avgSpanOfControl.toFixed(1)}. Consider consolidating management layers.`
                        : tenureMetrics.avgSpanOfControl > 8
                        ? `High span of ${tenureMetrics.avgSpanOfControl.toFixed(1)}. Consider adding more managers.`
                        : `Healthy span of ${tenureMetrics.avgSpanOfControl.toFixed(1)} is within industry standards (5-8).`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  {managementPercentage > 30 ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  ) : icPercentage > 70 ? (
                    <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <Users className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  )}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">Org Structure</h5>
                    <p className="mt-1 text-xs text-gray-600">
                      {managementPercentage > 30
                        ? `Management makes up ${managementPercentage.toFixed(1)}% of workforce. Consider flattening the organization.`
                        : icPercentage > 70
                        ? `${icPercentage.toFixed(1)}% ICs indicates a flat, agile structure.`
                        : `Balanced mix of ${managementPercentage.toFixed(0)}% management and ${icPercentage.toFixed(0)}% ICs.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Retention Warning */}
              {tenureMetrics.buckets['<6m'] / totalEmployees > 0.3 && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-medium text-yellow-900">Early Turnover Risk</h5>
                      <p className="mt-1 text-xs text-yellow-700">
                        {((tenureMetrics.buckets['<6m'] / totalEmployees) * 100).toFixed(0)}% of employees have been with the company less than 6 months.
                        Monitor onboarding and early retention.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-8 py-4">
        <p className="text-xs text-gray-500">
          Industry benchmarks: 5-8 direct reports • Management should comprise 15-25% of workforce
        </p>
      </div>
    </div>
  );
}
