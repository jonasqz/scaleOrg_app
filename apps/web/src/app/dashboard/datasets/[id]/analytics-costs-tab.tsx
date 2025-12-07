'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Users, TrendingUp, Calendar, Percent, Target } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsCostsTabProps {
  datasetId: string;
  currency: string;
  employees: any[];
}

interface MonthlyCostData {
  period: string;
  periodLabel: string;
  totalCost: number;
  employeeCount: number;
  avgCostPerEmployee: number;
  avgCostRatio: number;
  grossSalary: number;
  employerTaxes: number;
  socialContributions: number;
  healthInsurance: number;
  benefits: number;
  otherCosts: number;
}

interface DepartmentCostData {
  department: string;
  totalCost: number;
  employeeCount: number;
  avgCostPerEmployee: number;
}

interface CostSummary {
  currentMonthCost: number;
  currentMonthCostPerEmployee: number;
  currentMonthRatio: number;
  previousMonthCost: number;
  costGrowthRate: number;
  avgMonthlyGrowthRate: number;
  projectedAnnualCost: number;
  monthsAvailable: number;
}

export default function AnalyticsCostsTab({
  datasetId,
  currency,
  employees,
}: AnalyticsCostsTabProps) {
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyCostData[]>([]);
  const [departmentCosts, setDepartmentCosts] = useState<DepartmentCostData[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCostData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/datasets/${datasetId}/employer-costs/analytics`);
        if (response.ok) {
          const data = await response.json();
          setMonthlyTrend(data.monthlyTrend || []);
          setDepartmentCosts(data.departmentCosts || []);
          setSummary(data.summary || null);
        }
      } catch (error) {
        console.error('Failed to fetch employer cost data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCostData();
  }, [datasetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading employer cost data...</p>
        </div>
      </div>
    );
  }

  if (!summary || monthlyTrend.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No employer cost data yet</h3>
        <p className="mt-2 text-sm text-gray-600">
          Import your monthly payroll reports to track employer costs over time
        </p>
        <p className="mt-4 text-xs text-gray-500">
          Upload gross-net statements from your payroll accounting to see trends, forecasts, and cost optimization insights
        </p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${currency} ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${currency} ${(value / 1000).toFixed(0)}k`;
    }
    return `${currency} ${value.toFixed(0)}`;
  };

  const formatPercentChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 5) return 'text-red-600';
    if (value > 0) return 'text-orange-600';
    if (value > -5) return 'text-green-600';
    return 'text-blue-600';
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards - Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Monthly Cost */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(summary.currentMonthCost)}
          </p>
          <p className="text-sm text-gray-600">Total Monthly Cost</p>
          {summary.previousMonthCost > 0 && (
            <p className={`mt-1 text-xs ${getChangeColor(summary.costGrowthRate)}`}>
              {formatPercentChange(summary.costGrowthRate)} vs last month
            </p>
          )}
        </div>

        {/* Cost per Employee */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(summary.currentMonthCostPerEmployee)}
          </p>
          <p className="text-sm text-gray-600">Cost per Employee</p>
          <p className="mt-1 text-xs text-gray-500">
            Current month average
          </p>
        </div>

        {/* Employer Cost Ratio */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Percent className="h-8 w-8 text-purple-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {summary.currentMonthRatio.toFixed(2)}x
          </p>
          <p className="text-sm text-gray-600">Employer Cost Ratio</p>
          <p className="mt-1 text-xs text-gray-500">
            {((summary.currentMonthRatio - 1) * 100).toFixed(0)}% overhead on gross compensation
          </p>
        </div>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 12-Month Trend */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <TrendingUp className={`h-8 w-8 ${summary.avgMonthlyGrowthRate > 0 ? 'text-orange-600' : 'text-green-600'}`} />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {summary.avgMonthlyGrowthRate > 0 ? '↗' : '↘'} {summary.avgMonthlyGrowthRate > 0 ? 'Growing' : 'Declining'}
          </p>
          <p className="text-sm text-gray-600">{summary.monthsAvailable}-Month Trend</p>
          <p className="mt-1 text-xs text-gray-500">
            {formatPercentChange(summary.avgMonthlyGrowthRate)} per month
          </p>
        </div>

        {/* Cost Growth Rate */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatPercentChange(summary.avgMonthlyGrowthRate)}
          </p>
          <p className="text-sm text-gray-600">Avg Monthly Growth</p>
          <p className="mt-1 text-xs text-gray-500">
            {formatPercentChange(summary.avgMonthlyGrowthRate * 12)} annually
          </p>
        </div>

        {/* Projected Annual Cost */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Target className="h-8 w-8 text-cyan-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(summary.projectedAnnualCost)}
          </p>
          <p className="text-sm text-gray-600">Projected Annual Cost</p>
          <p className="mt-1 text-xs text-gray-500">
            Based on current trend
          </p>
        </div>
      </div>

      {/* Monthly Cost Trend Chart */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Monthly Cost Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="periodLabel"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalCost"
              stroke="#10b981"
              strokeWidth={2}
              name="Total Employer Cost"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="avgCostPerEmployee"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Cost per Employee"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Breakdown by Category */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Cost Breakdown Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="periodLabel"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="grossSalary"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              name="Gross Compensation"
            />
            <Area
              type="monotone"
              dataKey="employerTaxes"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              name="Employer Taxes"
            />
            <Area
              type="monotone"
              dataKey="socialContributions"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              name="Social Contributions"
            />
            <Area
              type="monotone"
              dataKey="healthInsurance"
              stackId="1"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              name="Health Insurance"
            />
            <Area
              type="monotone"
              dataKey="benefits"
              stackId="1"
              stroke="#ec4899"
              fill="#ec4899"
              name="Benefits"
            />
            <Area
              type="monotone"
              dataKey="otherCosts"
              stackId="1"
              stroke="#6b7280"
              fill="#6b7280"
              name="Other Costs"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Department Cost Comparison */}
      {departmentCosts.length > 0 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Cost by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentCosts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="department"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Bar
                dataKey="totalCost"
                fill="#10b981"
                name="Total Cost"
              />
              <Bar
                dataKey="avgCostPerEmployee"
                fill="#3b82f6"
                name="Avg Cost per Employee"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost Ratio Trend */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Employer Cost Ratio Trend</h3>
        <p className="mb-4 text-sm text-gray-600">
          Shows how employer costs compare to gross compensation over time (ratio of total cost to gross pay)
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="periodLabel"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={[1, 'auto']}
              tickFormatter={(value) => `${value.toFixed(2)}x`}
            />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)}x (${((value - 1) * 100).toFixed(0)}% overhead)`}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgCostRatio"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Employer Cost Ratio"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
