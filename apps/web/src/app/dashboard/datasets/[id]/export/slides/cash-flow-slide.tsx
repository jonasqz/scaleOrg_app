import React from 'react';
import { DollarSign, TrendingDown, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { BrandingConfig } from '@/lib/export-types';

interface CashFlowSlideProps {
  dataset: any;
  currency: string;
  cashFlowData: {
    summary: {
      currentCash: number;
      avgMonthlyBurn: number;
      avgMonthlyRevenue: number;
      runway: number | null;
      runwayDate: string | null;
    };
    monthlyData: any[];
  };
  branding: BrandingConfig;
}

export function CashFlowSlide({ dataset, currency, cashFlowData, branding }: CashFlowSlideProps) {
  const { summary, monthlyData } = cashFlowData;

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
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

  // Get next 6 months of data
  const futureMonths = monthlyData.filter(m => m.isFuture || m.isCurrent).slice(0, 6);

  // Calculate burn multiple
  const burnMultiple = summary.avgMonthlyRevenue > 0
    ? summary.avgMonthlyBurn / summary.avgMonthlyRevenue
    : null;

  const isRunwayLow = summary.runway !== null && summary.runway < 6;
  const isNetPositive = summary.avgMonthlyRevenue > Math.abs(summary.avgMonthlyBurn);

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
          Cash Flow & Runway
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Financial health and cash runway projections
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Key Metrics */}
          <div className="space-y-6">
            {/* Current Cash */}
            <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-gray-800">Current Cash</h3>
              </div>
              <div className="mt-4 text-5xl font-bold text-green-900">
                {formatCurrency(summary.currentCash)}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                As of {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Financial Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Monthly Burn */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.avgMonthlyBurn)}
                </p>
                <p className="text-xs text-gray-600">Monthly Burn</p>
                <p className="mt-1 text-[10px] text-gray-500">
                  Compensation costs
                </p>
              </div>

              {/* Monthly Revenue */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.avgMonthlyRevenue)}
                </p>
                <p className="text-xs text-gray-600">Monthly Revenue</p>
                <p className="mt-1 text-[10px] text-gray-500">
                  Last 6mo avg
                </p>
              </div>
            </div>

            {/* Runway */}
            <div
              className={`rounded-xl p-6 ${
                isRunwayLow
                  ? 'bg-gradient-to-br from-orange-50 to-orange-100'
                  : 'bg-gradient-to-br from-purple-50 to-purple-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar
                  className={`h-6 w-6 ${isRunwayLow ? 'text-orange-600' : 'text-purple-600'}`}
                />
                <h3 className="font-semibold text-gray-800">Cash Runway</h3>
              </div>
              <div
                className={`mt-4 text-5xl font-bold ${
                  isRunwayLow ? 'text-orange-900' : 'text-purple-900'
                }`}
              >
                {summary.runway !== null ? `${summary.runway.toFixed(1)}mo` : 'N/A'}
              </div>
              {summary.runwayDate && (
                <p className="mt-2 text-sm text-gray-600">
                  Runs out: {summary.runwayDate}
                </p>
              )}
              {isRunwayLow && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/50 p-3">
                  <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <p className="text-xs text-orange-900">
                    Less than 6 months runway remaining
                  </p>
                </div>
              )}
            </div>

            {/* Burn Multiple */}
            {burnMultiple !== null && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-xs font-semibold text-gray-700">Burn Multiple</h4>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {burnMultiple.toFixed(2)}x
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {burnMultiple < 1
                    ? 'Net positive cash flow'
                    : `Burning ${burnMultiple.toFixed(1)}x revenue`}
                </p>
                <p className="mt-2 text-[10px] text-gray-500">
                  Industry benchmark: &lt;2x for growth stage
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Projections */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                6-Month Projection
              </h3>

              {/* Cash Flow Table */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                        Month
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">
                        Revenue
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">
                        Burn
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">
                        Cash
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {futureMonths.map((month, idx) => {
                      const isNegativeCash = month.endingCash !== null && month.endingCash < 0;
                      const isLowCash =
                        month.endingCash !== null &&
                        month.endingCash < summary.currentCash * 0.2;

                      return (
                        <tr
                          key={month.month}
                          className={`${
                            isNegativeCash
                              ? 'bg-red-50'
                              : isLowCash
                              ? 'bg-yellow-50'
                              : ''
                          }`}
                        >
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {month.label}
                          </td>
                          <td className="px-3 py-2 text-right text-blue-600">
                            {formatCurrency(month.revenue)}
                          </td>
                          <td className="px-3 py-2 text-right text-red-600">
                            {formatCurrency(month.burn)}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-bold ${
                              isNegativeCash
                                ? 'text-red-600'
                                : isLowCash
                                ? 'text-yellow-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {formatCurrency(month.endingCash)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Key Insights</h4>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  {isNetPositive ? (
                    <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  )}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">Cash Flow Status</h5>
                    <p className="mt-1 text-xs text-gray-600">
                      {isNetPositive
                        ? `Revenue (${formatCurrency(summary.avgMonthlyRevenue)}) exceeds burn (${formatCurrency(summary.avgMonthlyBurn)}). Company is cash flow positive.`
                        : `Monthly burn (${formatCurrency(summary.avgMonthlyBurn)}) exceeds revenue (${formatCurrency(summary.avgMonthlyRevenue)}). Focus on revenue growth or cost optimization.`}
                    </p>
                  </div>
                </div>
              </div>

              {isRunwayLow && (
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-medium text-orange-900">
                        Low Runway Alert
                      </h5>
                      <p className="mt-1 text-xs text-orange-700">
                        With {summary.runway?.toFixed(1)} months of runway remaining, consider:
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-orange-700">
                        <li>• Initiating fundraising conversations</li>
                        <li>• Accelerating revenue growth initiatives</li>
                        <li>• Reviewing and optimizing burn rate</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {!isNetPositive && burnMultiple && burnMultiple > 2 && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-medium text-yellow-900">
                        High Burn Multiple
                      </h5>
                      <p className="mt-1 text-xs text-yellow-700">
                        Burn multiple of {burnMultiple.toFixed(1)}x is above typical growth stage
                        benchmarks (&lt;2x). Review cost structure.
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
          Projections based on current compensation costs and revenue trends • Update revenue
          forecasts for accurate runway calculations
        </p>
      </div>
    </div>
  );
}
