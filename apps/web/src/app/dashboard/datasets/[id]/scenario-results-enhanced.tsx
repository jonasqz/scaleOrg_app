'use client';

import { Calendar, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface AffectedEmployee {
  id: string;
  employeeId: string;
  employeeName: string | null;
  department: string;
  role: string | null;
  totalCompensation: number;
  action: 'remove' | 'add';
  effectiveDate: Date | null;
  isNew?: boolean;
}

interface MonthlyBurnRate {
  month: string;
  baselineCost: number;
  scenarioCost: number;
  savings: number;
  effectiveEmployeeCount: number;
}

interface RunwayAnalysis {
  currentCash: number | null;
  baselineRunwayMonths: number | null;
  scenarioRunwayMonths: number | null;
  runwayExtensionMonths: number | null;
  baselineRunoutDate: Date | null;
  scenarioRunoutDate: Date | null;
}

interface YearEndProjection {
  year: number;
  baselineTotal: number;
  scenarioTotal: number;
  totalSavings: number;
  avgMonthlyBurn: number;
}

interface ScenarioResultsEnhancedProps {
  affectedEmployees?: AffectedEmployee[];
  monthlyBurnRate?: MonthlyBurnRate[];
  runway?: RunwayAnalysis;
  yearEndProjection?: YearEndProjection;
  currency: string;
  onViewEmployees?: () => void;
}

export default function ScenarioResultsEnhanced({
  affectedEmployees,
  monthlyBurnRate,
  runway,
  yearEndProjection,
  currency,
  onViewEmployees,
}: ScenarioResultsEnhancedProps) {
  if (!affectedEmployees && !monthlyBurnRate && !runway && !yearEndProjection) {
    return null;
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatDate = (dateStr: Date | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Affected Employees */}
      {affectedEmployees && affectedEmployees.length > 0 && (
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Affected Employees ({affectedEmployees.length})
            </h3>
            <div className="flex items-center gap-2">
              {affectedEmployees.filter(e => e.action === 'remove').length > 0 && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                  {affectedEmployees.filter(e => e.action === 'remove').length} to remove
                </span>
              )}
              {affectedEmployees.filter(e => e.action === 'add').length > 0 && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {affectedEmployees.filter(e => e.action === 'add').length} to add
                </span>
              )}
              {onViewEmployees && (
                <button
                  onClick={onViewEmployees}
                  className="ml-2 rounded-lg border border-blue-600 bg-white px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                >
                  View Employee Table
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {affectedEmployees.map((emp) => (
              <div
                key={emp.id}
                className={`rounded-lg border p-4 ${
                  emp.action === 'remove'
                    ? 'border-red-200 bg-red-50'
                    : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {emp.action === 'remove' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      )}
                      <p className="font-medium text-gray-900">
                        {emp.employeeName || 'Unnamed Employee'}
                        {emp.isNew && (
                          <span className="ml-2 rounded bg-green-600 px-2 py-0.5 text-xs text-white">
                            New Hire
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                      <span>{emp.department}</span>
                      {emp.role && <span>· {emp.role}</span>}
                      <span>
                        · {currency} {(emp.totalCompensation / 1000).toFixed(0)}k/yr
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {emp.action === 'remove' ? 'Phase out:' : 'Start date:'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(emp.effectiveDate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      )}

      {/* Monthly Burn Rate */}
      {monthlyBurnRate && monthlyBurnRate.length > 0 && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Monthly Burn Rate Timeline
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-600">
                  <th className="pb-2">Month</th>
                  <th className="pb-2 text-right">Baseline</th>
                  <th className="pb-2 text-right">Scenario</th>
                  <th className="pb-2 text-right">Savings</th>
                  <th className="pb-2 text-right">Headcount</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBurnRate.slice(0, 12).map((month) => (
                  <tr key={month.month} className="border-b text-sm">
                    <td className="py-2 font-medium text-gray-900">
                      {formatMonth(month.month)}
                    </td>
                    <td className="py-2 text-right text-gray-600">
                      {currency} {(month.baselineCost / 1000).toFixed(0)}k
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      {currency} {(month.scenarioCost / 1000).toFixed(0)}k
                    </td>
                    <td
                      className={`py-2 text-right font-semibold ${
                        month.savings >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {month.savings >= 0 && '+'}
                      {currency} {(month.savings / 1000).toFixed(0)}k
                    </td>
                    <td className="py-2 text-right text-gray-600">
                      {month.effectiveEmployeeCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Runway Analysis */}
      {runway && runway.currentCash && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Runway Analysis
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="mb-2 text-sm text-gray-600">Current Cash</p>
              <p className="text-2xl font-bold text-gray-900">
                {currency} {(runway.currentCash / 1000000).toFixed(2)}M
              </p>
            </div>

            <div className="rounded-lg border bg-blue-50 p-4">
              <p className="mb-2 text-sm text-gray-600">Baseline Runway</p>
              <p className="text-2xl font-bold text-gray-900">
                {runway.baselineRunwayMonths?.toFixed(1) || 'N/A'} months
              </p>
              {runway.baselineRunoutDate && (
                <p className="mt-1 text-xs text-gray-600">
                  Runs out: {formatDate(runway.baselineRunoutDate)}
                </p>
              )}
              {runway.baselineRunwayMonths && runway.baselineRunwayMonths < 12 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Low runway warning</span>
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-green-50 p-4">
              <p className="mb-2 text-sm text-gray-600">Scenario Runway</p>
              <p className="text-2xl font-bold text-green-700">
                {runway.scenarioRunwayMonths?.toFixed(1) || 'N/A'} months
              </p>
              {runway.scenarioRunoutDate && (
                <p className="mt-1 text-xs text-gray-600">
                  Runs out: {formatDate(runway.scenarioRunoutDate)}
                </p>
              )}
              {runway.runwayExtensionMonths && (
                <p className="mt-2 text-xs font-semibold text-green-700">
                  +{runway.runwayExtensionMonths.toFixed(1)} months extension
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Projection Chart */}
      {monthlyBurnRate && monthlyBurnRate.length > 0 && runway && runway.currentCash && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Cash Flow Projection
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Projected burn rate impact on cash balance over 12 months
          </p>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={monthlyBurnRate.slice(0, 12).map((month, idx) => {
                // Calculate cumulative cash balance
                const baselineCash = runway.currentCash - monthlyBurnRate.slice(0, idx + 1).reduce((sum, m) => sum + m.baselineCost, 0);
                const scenarioCash = runway.currentCash - monthlyBurnRate.slice(0, idx + 1).reduce((sum, m) => sum + m.scenarioCost, 0);

                return {
                  month: formatMonth(month.month),
                  baseline: baselineCash,
                  scenario: scenarioCash,
                };
              })}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${currency} ${(value / 1000000).toFixed(1)}M`} />
              <Tooltip
                formatter={(value: number) => `${currency} ${(value / 1000000).toFixed(2)}M`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="#60a5fa"
                strokeWidth={2}
                name="Baseline Cash"
                dot={{ fill: '#60a5fa' }}
              />
              <Line
                type="monotone"
                dataKey="scenario"
                stroke="#10b981"
                strokeWidth={2}
                name="Scenario Cash"
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Year-End Projection */}
      {yearEndProjection && (
        <div className="rounded-lg border bg-purple-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-purple-900">
            {yearEndProjection.year} Year-End Projection
          </h3>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-purple-700">Baseline Total</p>
              <p className="mt-1 text-xl font-bold text-purple-900">
                {currency} {(yearEndProjection.baselineTotal / 1000000).toFixed(2)}M
              </p>
            </div>

            <div>
              <p className="text-sm text-purple-700">Scenario Total</p>
              <p className="mt-1 text-xl font-bold text-purple-900">
                {currency} {(yearEndProjection.scenarioTotal / 1000000).toFixed(2)}M
              </p>
            </div>

            <div>
              <p className="text-sm text-purple-700">Total Savings</p>
              <p className="mt-1 text-xl font-bold text-green-700">
                {currency} {(yearEndProjection.totalSavings / 1000000).toFixed(2)}M
              </p>
            </div>

            <div>
              <p className="text-sm text-purple-700">Avg Monthly Burn</p>
              <p className="mt-1 text-xl font-bold text-purple-900">
                {currency} {(yearEndProjection.avgMonthlyBurn / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
