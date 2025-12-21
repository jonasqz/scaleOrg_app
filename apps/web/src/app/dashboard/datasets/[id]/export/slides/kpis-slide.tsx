import React from 'react';
import { TrendingUp, DollarSign, Users, Target, PieChart } from 'lucide-react';
import { BrandingConfig } from '@/lib/export-types';

interface KPIsSlideProps {
  metrics: any;
  employees: any[];
  dataset: any;
  currency: string;
  branding: BrandingConfig;
}

export function KPIsSlide({ metrics, employees, dataset, currency, branding }: KPIsSlideProps) {
  const totalEmployees = employees.length;
  const totalCompensation = employees.reduce(
    (sum, emp) => sum + (emp.totalCompensation || 0),
    0
  );
  const avgCompensation = totalEmployees > 0 ? totalCompensation / totalEmployees : 0;

  // Calculate departments
  const departments = Array.from(new Set(employees.map(e => e.department))).length;

  // Calculate gender diversity if available
  const withGenderData = employees.filter(e => e.gender && e.gender !== 'PREFER_NOT_TO_SAY');
  const femaleCount = employees.filter(e => e.gender === 'FEMALE').length;
  const diversityPercentage =
    withGenderData.length > 0 ? (femaleCount / withGenderData.length) * 100 : null;

  // Revenue per employee
  const revenuePerEmployee = dataset.totalRevenue && totalEmployees > 0
    ? Number(dataset.totalRevenue) / totalEmployees
    : null;

  // Compensation as % of revenue
  const compensationAsPercentRevenue =
    dataset.totalRevenue && Number(dataset.totalRevenue) > 0
      ? (totalCompensation / Number(dataset.totalRevenue)) * 100
      : null;

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '—';
    // Convert to number in case it's a Decimal object from Prisma
    const numValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numValue)) return '—';

    const absValue = Math.abs(numValue);
    if (absValue >= 1000000) {
      return `${currency} ${(numValue / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${currency} ${(numValue / 1000).toFixed(0)}k`;
    }
    return `${currency} ${numValue.toFixed(0)}`;
  };

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
          Key Performance Indicators
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Critical workforce and financial metrics at a glance
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Workforce Metrics */}
          <div className="col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Workforce Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Total Headcount */}
                <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-5">
                  <div className="text-xs text-gray-600">Total Headcount</div>
                  <div className="mt-2 text-4xl font-bold text-orange-900">
                    {totalEmployees}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Across {departments} departments
                  </div>
                </div>

                {/* Avg Compensation */}
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-5">
                  <div className="text-xs text-gray-600">Avg Compensation</div>
                  <div className="mt-2 text-4xl font-bold text-blue-900">
                    {formatCurrency(avgCompensation)}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Per employee (FTE)
                  </div>
                </div>

                {/* Total Compensation Budget */}
                <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-5">
                  <div className="text-xs text-gray-600">Total Comp Budget</div>
                  <div className="mt-2 text-4xl font-bold text-green-900">
                    {formatCurrency(totalCompensation)}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Annual compensation
                  </div>
                </div>

                {/* Diversity */}
                {diversityPercentage !== null && (
                  <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-5">
                    <div className="text-xs text-gray-600">Female Representation</div>
                    <div className="mt-2 text-4xl font-bold text-purple-900">
                      {diversityPercentage.toFixed(0)}%
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Of employees with gender data
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Efficiency */}
            {(revenuePerEmployee !== null || compensationAsPercentRevenue !== null) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Efficiency
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {revenuePerEmployee !== null && (
                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">Revenue per Employee</div>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="mt-3 text-3xl font-bold text-gray-900">
                        {formatCurrency(revenuePerEmployee)}
                      </div>
                      <div className="mt-1 text-[10px] text-gray-500">
                        Benchmark: {currency} 150-200k (SaaS)
                      </div>
                    </div>
                  )}

                  {compensationAsPercentRevenue !== null && (
                    <div className="rounded-lg border border-gray-200 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">Compensation % Revenue</div>
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="mt-3 text-3xl font-bold text-gray-900">
                        {compensationAsPercentRevenue.toFixed(0)}%
                      </div>
                      <div className="mt-1 text-[10px] text-gray-500">
                        Benchmark: 30-40% (efficient)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Department Distribution */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Department Distribution
              </h3>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                {Array.from(new Set(employees.map(e => e.department)))
                  .sort((a, b) => {
                    const countA = employees.filter(e => e.department === a).length;
                    const countB = employees.filter(e => e.department === b).length;
                    return countB - countA;
                  })
                  .slice(0, 6)
                  .map(dept => {
                    const count = employees.filter(e => e.department === dept).length;
                    const percentage = (count / totalEmployees) * 100;
                    return (
                      <div key={dept} className="flex items-center gap-3 py-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-900">{dept}</span>
                            <span className="text-xs text-gray-600">{count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-orange-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 w-12 text-right">
                          {percentage.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Insights */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Performance Summary
              </h3>

              <div className="space-y-3">
                {/* Headcount Growth */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-gray-700">Headcount</div>
                    <div
                      className={`text-2xl font-bold ${
                        totalEmployees >= 50 ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {totalEmployees >= 100
                        ? 'Scale'
                        : totalEmployees >= 50
                        ? 'Growth'
                        : 'Seed'}
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-gray-600">
                    {totalEmployees < 50
                      ? 'Early stage team'
                      : totalEmployees < 100
                      ? 'Growing organization'
                      : 'Scaled organization'}
                  </p>
                </div>

                {/* Compensation Health */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-gray-700">Cost Structure</div>
                    <div
                      className={`text-2xl font-bold ${
                        compensationAsPercentRevenue === null
                          ? 'text-gray-400'
                          : compensationAsPercentRevenue <= 40
                          ? 'text-green-600'
                          : compensationAsPercentRevenue <= 60
                          ? 'text-orange-600'
                          : 'text-red-600'
                      }`}
                    >
                      {compensationAsPercentRevenue === null
                        ? 'N/A'
                        : compensationAsPercentRevenue <= 40
                        ? 'Healthy'
                        : compensationAsPercentRevenue <= 60
                        ? 'Watch'
                        : 'High'}
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-gray-600">
                    {compensationAsPercentRevenue === null
                      ? 'Set revenue to calculate'
                      : compensationAsPercentRevenue <= 40
                      ? 'Efficient cost structure'
                      : 'Review compensation costs'}
                  </p>
                </div>

                {/* Productivity */}
                {revenuePerEmployee !== null && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-gray-700">Productivity</div>
                      <div
                        className={`text-2xl font-bold ${
                          revenuePerEmployee >= 150000
                            ? 'text-green-600'
                            : revenuePerEmployee >= 100000
                            ? 'text-orange-600'
                            : 'text-red-600'
                        }`}
                      >
                        {revenuePerEmployee >= 150000
                          ? 'High'
                          : revenuePerEmployee >= 100000
                          ? 'Medium'
                          : 'Low'}
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-gray-600">
                      {formatCurrency(revenuePerEmployee)} per employee
                    </p>
                  </div>
                )}

                {/* Diversity */}
                {diversityPercentage !== null && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-gray-700">Diversity</div>
                      <div
                        className={`text-2xl font-bold ${
                          diversityPercentage >= 40
                            ? 'text-green-600'
                            : diversityPercentage >= 30
                            ? 'text-orange-600'
                            : 'text-red-600'
                        }`}
                      >
                        {diversityPercentage >= 40
                          ? 'Good'
                          : diversityPercentage >= 30
                          ? 'Fair'
                          : 'Low'}
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-gray-600">
                      {diversityPercentage.toFixed(0)}% female representation
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
              <h4 className="text-xs font-semibold text-orange-900 mb-2">
                Key Takeaways
              </h4>
              <ul className="space-y-1.5 text-[10px] text-orange-800">
                <li className="flex items-start gap-1.5">
                  <span>•</span>
                  <span>
                    Total workforce of {totalEmployees} with average compensation of{' '}
                    {formatCurrency(avgCompensation)}
                  </span>
                </li>
                {compensationAsPercentRevenue !== null && (
                  <li className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>
                      Compensation represents {compensationAsPercentRevenue.toFixed(0)}% of revenue
                    </span>
                  </li>
                )}
                {revenuePerEmployee !== null && (
                  <li className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>
                      Revenue per employee: {formatCurrency(revenuePerEmployee)}
                    </span>
                  </li>
                )}
                {diversityPercentage !== null && (
                  <li className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>
                      {diversityPercentage.toFixed(0)}% female representation in workforce
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-8 py-4">
        <p className="text-xs text-gray-500">
          Industry benchmarks vary by sector and growth stage • Consult with advisors for specific guidance
        </p>
      </div>
    </div>
  );
}
