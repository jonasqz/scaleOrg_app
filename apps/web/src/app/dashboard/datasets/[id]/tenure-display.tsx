'use client';

import { Clock, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TenureDisplayProps {
  tenure: {
    avgTenureMonths: number;
    avgTenureYears: number;
    medianTenureMonths: number;
    tenureDistribution: {
      '0-6months': number;
      '6-12months': number;
      '1-2years': number;
      '2-5years': number;
      '5plus': number;
    };
    tenureByDepartment: {
      [department: string]: {
        avgMonths: number;
        avgYears: number;
        employeeCount: number;
      };
    };
    retentionRisk: {
      high: any[];
      medium: any[];
      low: any[];
    };
  };
}

export default function TenureDisplay({ tenure }: TenureDisplayProps) {
  // Prepare distribution data for chart
  const distributionData = [
    { range: '0-6 months', count: tenure.tenureDistribution['0-6months'], color: '#ef4444' },
    { range: '6-12 months', count: tenure.tenureDistribution['6-12months'], color: '#f97316' },
    { range: '1-2 years', count: tenure.tenureDistribution['1-2years'], color: '#eab308' },
    { range: '2-5 years', count: tenure.tenureDistribution['2-5years'], color: '#22c55e' },
    { range: '5+ years', count: tenure.tenureDistribution['5plus'], color: '#3b82f6' },
  ];

  // Prepare department data for chart
  const departmentData = Object.entries(tenure.tenureByDepartment)
    .map(([dept, data]) => ({
      department: dept,
      avgYears: Number(data.avgYears.toFixed(1)),
      employees: data.employeeCount,
    }))
    .sort((a, b) => b.avgYears - a.avgYears);

  const formatTenure = (months: number): string => {
    const years = Math.floor(months / 12);
    const remainingMonths = Math.floor(months % 12);

    if (years === 0) return `${remainingMonths}m`;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}m`;
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <Clock className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Tenure Analysis</h2>
          <p className="text-sm text-gray-600 mt-1">
            Workforce stability and retention insights
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Average Tenure</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatTenure(tenure.avgTenureMonths)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ({tenure.avgTenureYears.toFixed(1)} years)
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Median Tenure</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatTenure(tenure.medianTenureMonths)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            50th percentile
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Retention Risk</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {tenure.retentionRisk.high.length + tenure.retentionRisk.medium.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {tenure.retentionRisk.high.length} high, {tenure.retentionRisk.medium.length} medium
          </p>
        </div>
      </div>

      {/* Tenure Distribution Chart */}
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-medium text-gray-700">Tenure Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar
              dataKey="count"
              name="Employees"
              radius={[4, 4, 0, 0]}
            >
              {distributionData.map((entry, index) => (
                <Bar key={index} dataKey="count" fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {distributionData.map((item) => (
            <div key={item.range} className="text-center">
              <div
                className="h-2 rounded-full mb-1"
                style={{ backgroundColor: item.color }}
              />
              <p className="text-xs text-gray-600">{item.range}</p>
              <p className="text-sm font-semibold text-gray-900">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Department Tenure */}
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-medium text-gray-700">Average Tenure by Department</h3>
        <ResponsiveContainer width="100%" height={Math.max(200, departmentData.length * 40)}>
          <BarChart data={departmentData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis
              type="category"
              dataKey="department"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="avgYears" name="Avg Years" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Retention Risk Breakdown */}
      {(tenure.retentionRisk.high.length > 0 || tenure.retentionRisk.medium.length > 0) && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Retention Risk Alert</h3>
              <div className="mt-2 space-y-2">
                {tenure.retentionRisk.high.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-700">
                      <span className="font-semibold">High Risk:</span> {tenure.retentionRisk.high.length} employees with &lt;6 months tenure
                    </span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Critical
                    </span>
                  </div>
                )}
                {tenure.retentionRisk.medium.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-700">
                      <span className="font-semibold">Medium Risk:</span> {tenure.retentionRisk.medium.length} employees with 6-12 months tenure
                    </span>
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                      Watch
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-yellow-600 mt-3">
                Employees with less than 1 year tenure have higher turnover risk. Consider engagement and retention initiatives.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2">Tenure Insights</h3>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>
            <span className="font-semibold">Stability:</span> Average tenure of {formatTenure(tenure.avgTenureMonths)} indicates{' '}
            {tenure.avgTenureYears < 1
              ? 'very new team (high growth or turnover)'
              : tenure.avgTenureYears < 2
              ? 'relatively new team'
              : tenure.avgTenureYears < 3
              ? 'moderate team stability'
              : 'strong team stability'}
          </li>
          <li>
            <span className="font-semibold">Distribution:</span> {tenure.tenureDistribution['5plus']} employees ({((tenure.tenureDistribution['5plus'] / (Object.values(tenure.tenureDistribution).reduce((a, b) => a + b, 0))) * 100).toFixed(0)}%) have 5+ years tenure
          </li>
          {tenure.avgTenureYears < 1.5 && (
            <li className="text-yellow-700">
              <span className="font-semibold">Action:</span> Low average tenure may indicate retention challenges or rapid growth
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
