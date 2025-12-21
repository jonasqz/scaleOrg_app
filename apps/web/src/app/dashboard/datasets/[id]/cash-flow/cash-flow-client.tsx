'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, ArrowUpCircle, ArrowDownCircle, GitBranch, Save, Plus, Minus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';

interface CashFlowClientProps {
  datasetId: string;
  currency: string;
  currentCashBalance: number | null;
}

interface MonthlyData {
  month: string;
  label: string;
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  revenue: number | null;
  burn: number | null;
  netCashFlow: number | null;
  endingCash: number | null;
  isRevenueEditable: boolean;
}

export default function CashFlowClient({
  datasetId,
  currency,
  currentCashBalance,
}: CashFlowClientProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [growthRate, setGrowthRate] = useState('10');
  const [showGrowthModal, setShowGrowthModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [datasetId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/datasets/${datasetId}/cash-flow`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyData(data.monthlyData || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch cash flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevenueUpdate = async (month: string, value: number) => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}/cash-flow/revenue`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: month,
          revenue: value,
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to update revenue:', error);
    }
  };

  const applyGrowthRate = async () => {
    setSaving(true);
    try {
      const rate = parseFloat(growthRate) / 100;

      // Find the last month with revenue
      const currentMonthIndex = monthlyData.findIndex(m => m.isCurrent);
      if (currentMonthIndex === -1) return;

      let lastRevenue = monthlyData[currentMonthIndex]?.revenue;

      // If no revenue in current month, look backwards
      if (!lastRevenue) {
        for (let i = currentMonthIndex - 1; i >= 0; i--) {
          if (monthlyData[i].revenue) {
            lastRevenue = monthlyData[i].revenue;
            break;
          }
        }
      }

      if (!lastRevenue) {
        alert('Please enter revenue for at least one historical month first');
        setSaving(false);
        return;
      }

      // Apply growth to all future months
      const updates = [];
      let projectedRevenue = lastRevenue;

      for (let i = currentMonthIndex; i < monthlyData.length; i++) {
        if (monthlyData[i].isFuture || monthlyData[i].isCurrent) {
          projectedRevenue = projectedRevenue * (1 + rate);
          updates.push({
            period: monthlyData[i].month,
            revenue: projectedRevenue,
          });
        }
      }

      // Bulk update
      const response = await fetch(`/api/datasets/${datasetId}/cash-flow/revenue/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        await fetchData();
        setShowGrowthModal(false);
      }
    } catch (error) {
      console.error('Failed to apply growth rate:', error);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (month: string, currentValue: number | null) => {
    setEditingMonth(month);
    setEditValue(currentValue?.toFixed(0) || '');
  };

  const saveEdit = async () => {
    if (!editingMonth) return;
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) {
      alert('Please enter a valid positive number');
      return;
    }
    await handleRevenueUpdate(editingMonth, value);
    setEditingMonth(null);
  };

  const cancelEdit = () => {
    setEditingMonth(null);
    setEditValue('');
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `${currency} ${(value / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${currency} ${(value / 1000).toFixed(0)}k`;
    }
    return `${currency} ${value.toFixed(0)}`;
  };

  const formatNumber = (value: number | null) => {
    if (value === null) return '—';
    return value.toFixed(1);
  };

  // Prepare chart data
  const chartData = monthlyData
    .filter(m => m.endingCash !== null)
    .map(m => ({
      month: m.label,
      cash: m.endingCash,
      revenue: m.revenue || 0,
      burn: m.burn ? Math.abs(m.burn) : 0,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-xs text-stone-600">Loading cash flow data...</p>
        </div>
      </div>
    );
  }

  // Check if cash balance is set
  if (currentCashBalance === null) {
    return (
      <div className="rounded-lg border-2 border-dashed border-yellow-200 bg-yellow-50 p-10 text-center">
        <DollarSign className="mx-auto h-10 w-10 text-yellow-600" />
        <h3 className="mt-3 text-sm font-semibold text-stone-900">Cash Balance Not Set</h3>
        <p className="mt-1 text-xs text-stone-600">
          Please set your current cash balance in Settings to use Cash Flow tracking
        </p>
        <Link
          href={`/dashboard/datasets/${datasetId}/settings`}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
        >
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Current Cash */}
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-stone-900">
            {formatCurrency(summary?.currentCash || currentCashBalance)}
          </p>
          <p className="text-[11px] font-medium text-stone-500">Current Cash Balance</p>
          <p className="mt-0.5 text-[10px] text-stone-400">
            As of {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Monthly Burn */}
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-stone-900">
            {formatCurrency(summary?.avgMonthlyBurn || 0)}
          </p>
          <p className="text-[11px] font-medium text-stone-500">Avg Monthly Burn</p>
          <p className="mt-0.5 text-[10px] text-stone-400">
            From compensation costs
          </p>
        </div>

        {/* Monthly Revenue */}
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-stone-900">
            {formatCurrency(summary?.avgMonthlyRevenue || 0)}
          </p>
          <p className="text-[11px] font-medium text-stone-500">Avg Monthly Revenue</p>
          <p className="mt-0.5 text-[10px] text-stone-400">
            Last 6 months actual
          </p>
        </div>

        {/* Runway */}
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <Calendar className={`h-5 w-5 ${summary?.runway && summary.runway < 6 ? 'text-orange-600' : 'text-purple-600'}`} />
          </div>
          <p className={`mt-3 text-2xl font-bold ${summary?.runway && summary.runway < 6 ? 'text-orange-600' : 'text-stone-900'}`}>
            {summary?.runway !== null ? `${formatNumber(summary?.runway)} mo` : 'N/A'}
          </p>
          <p className="text-[11px] font-medium text-stone-500">Cash Runway</p>
          <p className="mt-0.5 text-[10px] text-stone-400">
            {summary?.runwayDate || 'Update revenue forecast'}
          </p>
        </div>
      </div>

      {/* Cash Balance Projection Chart */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Cash Balance Projection</h2>
            <p className="text-xs text-stone-500">24-month cash flow forecast</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${currency} ${(value / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="cash"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              name="Cash Balance"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue vs Burn Chart */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-stone-900">Revenue vs Burn Rate</h2>
          <p className="text-xs text-stone-500">Monthly comparison</p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${currency} ${(value / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="burn"
              stroke="#ef4444"
              strokeWidth={2}
              name="Burn"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Data Table */}
      <div className="rounded-lg border border-stone-200 bg-white">
        <div className="border-b border-stone-200 p-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Monthly Cash Flow</h2>
            <p className="text-xs text-stone-500">
              Revenue, burn rate, and cash balance projections
            </p>
          </div>
          <button
            onClick={() => setShowGrowthModal(true)}
            className="flex items-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Apply Growth Rate
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-stone-500 uppercase">
                  Month
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-medium text-stone-500 uppercase">
                  Revenue
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-medium text-stone-500 uppercase">
                  Burn
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-medium text-stone-500 uppercase">
                  Net Cash Flow
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-medium text-stone-500 uppercase">
                  Ending Cash
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {monthlyData.map((month) => {
                const isEditing = editingMonth === month.month;
                const isNegativeCash = month.endingCash !== null && month.endingCash < 0;
                const isLowCash = month.endingCash !== null && month.endingCash < (currentCashBalance * 0.2);

                return (
                  <tr
                    key={month.month}
                    className={`${month.isCurrent ? 'bg-orange-50' : ''} ${
                      isNegativeCash ? 'bg-red-50' : isLowCash ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-stone-900">
                      {month.label}
                      {month.isCurrent && (
                        <span className="ml-2 text-[10px] text-orange-600">(Current)</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-xs">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="w-20 rounded border border-stone-300 px-2 py-1 text-xs"
                            autoFocus
                          />
                          <button onClick={saveEdit} className="text-green-600 hover:text-green-700">
                            <Save className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(month.month, month.revenue)}
                          disabled={!month.isRevenueEditable}
                          className={`text-stone-900 hover:text-orange-600 ${
                            month.isRevenueEditable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                          }`}
                        >
                          {formatCurrency(month.revenue)}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-xs text-red-600">
                      {formatCurrency(month.burn)}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-right text-xs font-medium ${
                      month.netCashFlow !== null && month.netCashFlow > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(month.netCashFlow)}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-right text-xs font-bold ${
                      isNegativeCash ? 'text-red-600' : isLowCash ? 'text-yellow-600' : 'text-stone-900'
                    }`}>
                      {formatCurrency(month.endingCash)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario Planning Suggestion */}
      <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <GitBranch className="h-6 w-6 text-orange-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-orange-900">Ready for Scenario Planning?</h3>
            <p className="mt-1 text-xs text-orange-800">
              Use your cash flow projections to model different scenarios:
            </p>
            <ul className="mt-2 space-y-0.5 text-xs text-orange-800">
              <li>• <strong>Best Case:</strong> Revenue grows faster than expected</li>
              <li>• <strong>Base Case:</strong> Current trajectory continues</li>
              <li>• <strong>Worst Case:</strong> Revenue drops, burn stays constant</li>
              <li>• <strong>Fundraising Scenarios:</strong> Model different raise amounts and timing</li>
            </ul>
            <Link
              href={`/dashboard/datasets/${datasetId}/scenarios`}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
            >
              <GitBranch className="h-3.5 w-3.5" />
              Create Scenarios
            </Link>
          </div>
        </div>
      </div>

      {/* Growth Rate Modal */}
      {showGrowthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-stone-900">Apply Growth Rate</h3>
            <p className="mt-1 text-xs text-stone-600">
              Project future revenue based on a monthly growth rate
            </p>

            <div className="mt-3">
              <label className="block text-xs font-medium text-stone-700">
                Monthly Growth Rate (%)
              </label>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setGrowthRate((parseFloat(growthRate) - 5).toString())}
                  className="rounded-md border border-stone-300 p-1.5 hover:bg-stone-50"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  value={growthRate}
                  onChange={(e) => setGrowthRate(e.target.value)}
                  step="1"
                  className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-center text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
                <button
                  onClick={() => setGrowthRate((parseFloat(growthRate) + 5).toString())}
                  className="rounded-md border border-stone-300 p-1.5 hover:bg-stone-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-stone-500">
                Positive % = growth, Negative % = decline
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowGrowthModal(false)}
                className="rounded-md border border-stone-300 px-3 py-2 text-xs font-medium hover:bg-stone-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={applyGrowthRate}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3.5 w-3.5" />
                    Apply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
