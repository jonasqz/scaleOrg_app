'use client';

import React from 'react';
import {
  SlideTemplate,
  CoverSlide,
  MetricCard,
  InsightCallout,
} from './slide-template';
import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';

interface AnalyticsSlideDeckProps {
  dataset: any;
  employees: any[];
  metrics: any;
  benchmarkSummary?: {
    totalEmployees: number;
    benchmarkedEmployees: number;
    averageMarketPosition: number;
  };
}

export function AnalyticsSlideDeck({
  dataset,
  employees,
  metrics,
  benchmarkSummary,
}: AnalyticsSlideDeckProps) {
  const totalSlides = 7;

  // Calculate key metrics
  const totalHeadcount = employees.length;
  const totalCompensation = employees.reduce(
    (sum, emp) => sum + Number(emp.totalCompensation || 0),
    0
  );
  const avgCompensation = totalCompensation / totalHeadcount;

  // Calculate span of control metrics
  const managersWithReports = employees.filter((e) =>
    ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'].includes(e.level)
  );

  const totalDirectReports = employees.filter((e) => e.managerId).length;
  const avgSpanOfControl = managersWithReports.length > 0
    ? totalDirectReports / managersWithReports.length
    : 0;

  return (
    <div className="space-y-0">
      {/* Slide 1: Cover */}
      <CoverSlide
        companyName={dataset.companyName || 'Company'}
        datasetName={dataset.name}
      />

      {/* Slide 2: Executive Summary */}
      <SlideTemplate
        title="Executive Summary"
        slideNumber={2}
        totalSlides={totalSlides}
      >
        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Comprehensive workforce analysis covering {totalHeadcount} employees
            across {Object.keys(metrics.departments).length} departments.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <MetricCard
              label="Total Headcount"
              value={totalHeadcount}
              subtitle="Full-time equivalents"
            />
            <MetricCard
              label="Total Compensation"
              value={`${dataset.currency} ${(totalCompensation / 1000000).toFixed(1)}M`}
              subtitle="Annual spend"
            />
            <MetricCard
              label="R&D to GTM Ratio"
              value={metrics.ratios.rdToGTM.toFixed(2)}
              subtitle={
                metrics.ratios.rdToGTM > 2
                  ? 'R&D Heavy'
                  : metrics.ratios.rdToGTM < 1
                  ? 'GTM Heavy'
                  : 'Balanced'
              }
            />
            <MetricCard
              label="Avg Compensation"
              value={`${dataset.currency} ${(avgCompensation / 1000).toFixed(0)}k`}
              subtitle="Per employee"
            />
          </div>

          {benchmarkSummary && (
            <div className="mt-8">
              <InsightCallout
                type={
                  benchmarkSummary.averageMarketPosition > 5
                    ? 'success'
                    : benchmarkSummary.averageMarketPosition < -5
                    ? 'warning'
                    : 'info'
                }
                title="Market Positioning"
                description={`Your workforce is ${Math.abs(benchmarkSummary.averageMarketPosition)}% ${
                  benchmarkSummary.averageMarketPosition >= 0 ? 'above' : 'below'
                } market median across ${benchmarkSummary.benchmarkedEmployees} benchmarked employees.`}
              />
            </div>
          )}
        </div>
      </SlideTemplate>

      {/* Slide 3: Organizational Overview */}
      <SlideTemplate
        title="Organizational Overview"
        slideNumber={3}
        totalSlides={totalSlides}
      >
        <div className="space-y-8">
          <div>
            <h3 className="mb-4 text-xl font-semibold text-gray-900">
              Department Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(metrics.departments)
                .sort((a: any, b: any) => b[1].fte - a[1].fte)
                .map(([dept, data]: [string, any]) => (
                  <div key={dept} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-gray-700">
                      {dept}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-8 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full bg-gradient-to-r from-[#0891b2] to-[#2563eb]"
                            style={{ width: `${data.percentage}%` }}
                          ></div>
                        </div>
                        <div className="w-24 text-right text-sm font-semibold text-gray-900">
                          {data.fte.toFixed(1)} FTE
                        </div>
                        <div className="w-16 text-right text-xs text-gray-500">
                          {data.percentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xl font-semibold text-gray-900">
              Headcount by Level
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {['C_LEVEL', 'VP', 'DIRECTOR', 'MANAGER', 'IC'].map((level) => {
                const count =
                  employees.filter((e) => e.level === level).length || 0;
                const percentage = (count / totalHeadcount) * 100;
                return (
                  <div
                    key={level}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center"
                  >
                    <div className="text-xs font-medium text-gray-600">
                      {level === 'C_LEVEL' ? 'C-Level' : level}
                    </div>
                    <div className="mt-2 text-3xl font-bold text-[#1e3a8a]">
                      {count}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SlideTemplate>

      {/* Slide 4: Compensation Analysis */}
      <SlideTemplate
        title="Compensation Analysis"
        slideNumber={4}
        totalSlides={totalSlides}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <MetricCard
              label="Total Annual Spend"
              value={`${dataset.currency} ${(totalCompensation / 1000000).toFixed(2)}M`}
            />
            <MetricCard
              label="Average Compensation"
              value={`${dataset.currency} ${(avgCompensation / 1000).toFixed(0)}k`}
            />
            <MetricCard
              label="Cost per FTE"
              value={`${dataset.currency} ${(totalCompensation / metrics.summary.totalFTE / 1000).toFixed(0)}k`}
            />
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Top Roles by Average Compensation
            </h3>
            <div className="space-y-2">
              {employees
                .reduce((acc: any[], emp: any) => {
                  const role = emp.role || 'Unspecified';
                  const existing = acc.find((r) => r.role === role);
                  if (existing) {
                    existing.count++;
                    existing.total += Number(emp.totalCompensation);
                  } else {
                    acc.push({
                      role,
                      count: 1,
                      total: Number(emp.totalCompensation),
                    });
                  }
                  return acc;
                }, [])
                .map((r: any) => ({ ...r, avg: r.total / r.count }))
                .sort((a: any, b: any) => b.avg - a.avg)
                .slice(0, 8)
                .map((roleData: any) => (
                  <div
                    key={roleData.role}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {roleData.role}
                      </div>
                      <div className="text-sm text-gray-500">
                        {roleData.count}{' '}
                        {roleData.count === 1 ? 'employee' : 'employees'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {dataset.currency}{' '}
                        {(roleData.avg / 1000).toFixed(0)}k
                      </div>
                      <div className="text-xs text-gray-500">avg</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </SlideTemplate>

      {/* Slide 5: Market Benchmarking */}
      {benchmarkSummary && (
        <SlideTemplate
          title="Market Benchmarking"
          slideNumber={5}
          totalSlides={totalSlides}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <MetricCard
                label="Employees Benchmarked"
                value={benchmarkSummary.benchmarkedEmployees}
                subtitle={`${Math.round((benchmarkSummary.benchmarkedEmployees / benchmarkSummary.totalEmployees) * 100)}% coverage`}
              />
              <MetricCard
                label="Average Market Position"
                value={`${benchmarkSummary.averageMarketPosition >= 0 ? '+' : ''}${benchmarkSummary.averageMarketPosition}%`}
                subtitle={
                  benchmarkSummary.averageMarketPosition > 5
                    ? 'Above market'
                    : benchmarkSummary.averageMarketPosition < -5
                    ? 'Below market'
                    : 'On market'
                }
              />
              <MetricCard
                label="Benchmark Data"
                value="DACH Region"
                subtitle="SaaS Industry"
              />
            </div>

            <div className="space-y-4">
              <InsightCallout
                type={benchmarkSummary.averageMarketPosition > 5 ? 'success' : benchmarkSummary.averageMarketPosition < -5 ? 'warning' : 'info'}
                title="Competitive Positioning"
                description={
                  benchmarkSummary.averageMarketPosition > 5
                    ? 'Your compensation is above market average, which helps attract top talent but may impact margins.'
                    : benchmarkSummary.averageMarketPosition < -5
                    ? 'Your compensation is below market average, which may create retention risk for key roles.'
                    : 'Your compensation aligns with market rates, balancing competitiveness with cost efficiency.'
                }
              />

              {benchmarkSummary.benchmarkedEmployees <
                benchmarkSummary.totalEmployees * 0.8 && (
                <InsightCallout
                  type="info"
                  title="Limited Benchmark Coverage"
                  description={`${benchmarkSummary.totalEmployees - benchmarkSummary.benchmarkedEmployees} employees don't have matching benchmark data. Consider role title standardization to improve coverage.`}
                />
              )}
            </div>
          </div>
        </SlideTemplate>
      )}

      {/* Slide 6: Team Dynamics */}
      <SlideTemplate
        title="Team Dynamics & Structure"
        slideNumber={6}
        totalSlides={totalSlides}
      >
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-6">
            <MetricCard
              label="Total Managers"
              value={
                employees.filter((e) =>
                  ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'].includes(e.level)
                ).length
              }
              subtitle={`${((employees.filter((e) => ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'].includes(e.level)).length / totalHeadcount) * 100).toFixed(0)}% of workforce`}
            />
            <MetricCard
              label="Average Span of Control"
              value={avgSpanOfControl > 0 ? avgSpanOfControl.toFixed(1) : 'N/A'}
              subtitle="Reports per manager"
            />
            <MetricCard
              label="Manager to IC Ratio"
              value={`1:${(employees.filter((e) => e.level === 'IC').length / employees.filter((e) => ['MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL'].includes(e.level)).length || 1).toFixed(1)}`}
            />
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Key Observations
            </h3>
            <div className="space-y-3">
              {metrics.ratios.rdToGTM > 2.5 && (
                <InsightCallout
                  type="info"
                  title="R&D Heavy Organization"
                  description={`With a ${metrics.ratios.rdToGTM.toFixed(1)}:1 R&D:GTM ratio, you're heavily invested in product development. This is typical for early-stage or deep-tech companies.`}
                />
              )}

              {metrics.ratios.rdToGTM < 0.8 && (
                <InsightCallout
                  type="info"
                  title="GTM Heavy Organization"
                  description={`With a ${metrics.ratios.rdToGTM.toFixed(1)}:1 R&D:GTM ratio, you're heavily invested in go-to-market. This is typical for sales-driven or service businesses.`}
                />
              )}

              {avgSpanOfControl > 8 && (
                <InsightCallout
                  type="warning"
                  title="High Span of Control"
                  description="Average span of control above 8 may indicate managers are stretched thin. Consider adding mid-level management."
                />
              )}

              {avgSpanOfControl < 4 && avgSpanOfControl > 0 && totalHeadcount > 20 && (
                <InsightCallout
                  type="info"
                  title="Low Span of Control"
                  description="Average span of control below 4 may indicate over-management. Consider flattening the organization structure."
                />
              )}
            </div>
          </div>
        </div>
      </SlideTemplate>

      {/* Slide 7: Recommendations */}
      <SlideTemplate
        title="Strategic Recommendations"
        slideNumber={7}
        totalSlides={totalSlides}
      >
        <div className="space-y-6">
          <p className="text-gray-700">
            Based on comprehensive workforce analysis, we recommend the following
            strategic actions:
          </p>

          <div className="space-y-4">
            {benchmarkSummary && benchmarkSummary.averageMarketPosition < -5 && (
              <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4">
                <div className="flex gap-3">
                  <div className="text-2xl font-bold text-orange-600">1</div>
                  <div>
                    <h4 className="font-semibold text-orange-900">
                      Address Compensation Gap
                    </h4>
                    <p className="mt-1 text-sm text-orange-700">
                      Your compensation is {Math.abs(benchmarkSummary.averageMarketPosition)}% below market.
                      Prioritize compensation reviews for high-performers and critical roles
                      to reduce retention risk.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {metrics.ratios.rdToGTM > 3 && (
              <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {benchmarkSummary && benchmarkSummary.averageMarketPosition < -5 ? '2' : '1'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">
                      Balance R&D and GTM Investment
                    </h4>
                    <p className="mt-1 text-sm text-blue-700">
                      Your R&D:GTM ratio of {metrics.ratios.rdToGTM.toFixed(1)}:1
                      indicates heavy product focus. Consider strategic GTM hires to
                      drive revenue growth.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {avgSpanOfControl > 8 && (
              <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4">
                <div className="flex gap-3">
                  <div className="text-2xl font-bold text-purple-600">
                    {[
                      benchmarkSummary && benchmarkSummary.averageMarketPosition < -5,
                      metrics.ratios.rdToGTM > 3,
                    ].filter(Boolean).length + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900">
                      Strengthen Management Layer
                    </h4>
                    <p className="mt-1 text-sm text-purple-700">
                      Average span of control at{' '}
                      {avgSpanOfControl.toFixed(1)} is high. Add
                      mid-level managers to improve team support and reduce burnout.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
              <div className="flex gap-3">
                <div className="text-2xl font-bold text-teal-600">
                  {[
                    benchmarkSummary && benchmarkSummary.averageMarketPosition < -5,
                    metrics.ratios.rdToGTM > 3,
                    avgSpanOfControl > 8,
                  ].filter(Boolean).length + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-teal-900">
                    Implement Regular Workforce Reviews
                  </h4>
                  <p className="mt-1 text-sm text-teal-700">
                    Schedule quarterly workforce analytics reviews to track metrics,
                    identify trends early, and make data-driven hiring decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SlideTemplate>
    </div>
  );
}
