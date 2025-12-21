import React from 'react';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { BrandingConfig } from '@/lib/export-types';

interface PayGapSlideProps {
  employees: any[];
  currency: string;
  branding: BrandingConfig;
}

interface GenderStats {
  count: number;
  medianComp: number;
  meanComp: number;
}

function calculatePayGap(employees: any[]) {
  const maleEmployees = employees.filter(e => e.gender === 'MALE');
  const femaleEmployees = employees.filter(e => e.gender === 'FEMALE');
  const diverseEmployees = employees.filter(e => e.gender === 'DIVERSE');
  const notSpecifiedEmployees = employees.filter(e => !e.gender || e.gender === 'PREFER_NOT_TO_SAY');

  const calculateStats = (emps: any[]): GenderStats => {
    if (emps.length === 0) {
      return { count: 0, medianComp: 0, meanComp: 0 };
    }

    const comps = emps.map(e => Number(e.totalCompensation)).sort((a, b) => a - b);
    const medianComp = comps.length > 0
      ? comps.length % 2 === 0
        ? (comps[comps.length / 2 - 1] + comps[comps.length / 2]) / 2
        : comps[Math.floor(comps.length / 2)]
      : 0;
    const meanComp = comps.reduce((sum, c) => sum + c, 0) / comps.length;

    return { count: emps.length, medianComp, meanComp };
  };

  const male = calculateStats(maleEmployees);
  const female = calculateStats(femaleEmployees);
  const diverse = calculateStats(diverseEmployees);
  const notSpecified = calculateStats(notSpecifiedEmployees);

  const overallMedianGap = male.medianComp > 0 && female.medianComp > 0
    ? ((male.medianComp - female.medianComp) / male.medianComp) * 100
    : 0;

  const overallMeanGap = male.meanComp > 0 && female.meanComp > 0
    ? ((male.meanComp - female.meanComp) / male.meanComp) * 100
    : 0;

  return {
    male,
    female,
    diverse,
    notSpecified,
    overallMedianGap,
    overallMeanGap,
  };
}

function calculatePayGapByDepartment(employees: any[]) {
  const departments = Array.from(new Set(employees.map(e => e.department)));
  const result: Record<string, { gap: number; maleCount: number; femaleCount: number }> = {};

  departments.forEach(dept => {
    const deptEmployees = employees.filter(e => e.department === dept);
    const males = deptEmployees.filter(e => e.gender === 'MALE');
    const females = deptEmployees.filter(e => e.gender === 'FEMALE');

    if (males.length === 0 || females.length === 0) {
      return;
    }

    const maleMedian = males.map(e => Number(e.totalCompensation)).sort((a, b) => a - b)[Math.floor(males.length / 2)];
    const femaleMedian = females.map(e => Number(e.totalCompensation)).sort((a, b) => a - b)[Math.floor(females.length / 2)];

    const gap = maleMedian > 0 ? ((maleMedian - femaleMedian) / maleMedian) * 100 : 0;

    result[dept] = {
      gap,
      maleCount: males.length,
      femaleCount: females.length,
    };
  });

  return result;
}

export function PayGapSlide({ employees, currency, branding }: PayGapSlideProps) {
  const payGap = calculatePayGap(employees);
  const payGapByDept = calculatePayGapByDepartment(employees);
  const hasGenderData = payGap.male.count > 0 && payGap.female.count > 0;

  if (!hasGenderData) {
    return (
      <div className="flex h-[768px] w-[1024px] flex-col bg-white print:break-after-page">
        <div className="flex flex-1 items-center justify-center p-16">
          <div className="text-center">
            <Users className="mx-auto h-24 w-24 text-gray-300" />
            <p className="mt-6 text-xl font-semibold text-gray-600">
              Insufficient gender data for pay gap analysis
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Add gender information to enable pay gap insights
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalEmployees = employees.length;
  const employeesWithGender = payGap.male.count + payGap.female.count + payGap.diverse.count;
  const genderDataPercentage = (employeesWithGender / totalEmployees) * 100;

  const topDepartments = Object.entries(payGapByDept)
    .sort(([, a], [, b]) => Math.abs(b.gap) - Math.abs(a.gap))
    .slice(0, 5);

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
          Pay Gap Analysis
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Gender pay equity metrics • {employeesWithGender} of {totalEmployees} employees ({genderDataPercentage.toFixed(0)}% with gender data)
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Overall Metrics */}
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Overall Pay Gap</h3>
              <div className="space-y-4">
                {/* Median Gap */}
                <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Median Pay Gap</span>
                    {payGap.overallMedianGap > 0 ? (
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    ) : payGap.overallMedianGap < 0 ? (
                      <TrendingDown className="h-5 w-5 text-green-600" />
                    ) : null}
                  </div>
                  <div className={`mt-3 text-4xl font-bold ${
                    payGap.overallMedianGap > 10 ? 'text-red-600' :
                    payGap.overallMedianGap > 5 ? 'text-orange-600' :
                    payGap.overallMedianGap < -5 ? 'text-green-600' :
                    'text-gray-900'
                  }`}>
                    {payGap.overallMedianGap.toFixed(1)}%
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {payGap.overallMedianGap > 0
                      ? 'Males earn more'
                      : payGap.overallMedianGap < 0
                      ? 'Females earn more'
                      : 'Equal pay'}
                  </p>
                </div>

                {/* Mean Gap */}
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Mean Pay Gap</span>
                    {payGap.overallMeanGap > 0 ? (
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    ) : payGap.overallMeanGap < 0 ? (
                      <TrendingDown className="h-5 w-5 text-green-600" />
                    ) : null}
                  </div>
                  <div className={`mt-3 text-4xl font-bold ${
                    payGap.overallMeanGap > 10 ? 'text-red-600' :
                    payGap.overallMeanGap > 5 ? 'text-orange-600' :
                    payGap.overallMeanGap < -5 ? 'text-green-600' :
                    'text-gray-900'
                  }`}>
                    {payGap.overallMeanGap.toFixed(1)}%
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {payGap.overallMeanGap > 0
                      ? 'Males earn more'
                      : payGap.overallMeanGap < 0
                      ? 'Females earn more'
                      : 'Equal pay'}
                  </p>
                </div>
              </div>
            </div>

            {/* Gender Distribution */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Headcount by Gender</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-600">Male</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900">{payGap.male.count}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {currency} {Math.round(payGap.male.medianComp / 1000)}k median
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-600">Female</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900">{payGap.female.count}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {currency} {Math.round(payGap.female.medianComp / 1000)}k median
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-600">Diverse</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900">{payGap.diverse.count}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-600">Not Specified</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900">{payGap.notSpecified.count}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Department Breakdown */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Pay Gap by Department</h3>
            {topDepartments.length > 0 ? (
              <div className="space-y-3">
                {topDepartments.map(([dept, data]) => (
                  <div key={dept} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{dept}</h4>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                          <span>{data.maleCount} male</span>
                          <span>•</span>
                          <span>{data.femaleCount} female</span>
                        </div>
                      </div>
                      <div className={`text-right ${
                        data.gap > 10 ? 'text-red-600' :
                        data.gap > 5 ? 'text-orange-600' :
                        data.gap < -5 ? 'text-green-600' :
                        'text-gray-900'
                      }`}>
                        <div className="text-2xl font-bold">
                          {data.gap > 0 ? '+' : ''}{data.gap.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    {/* Visual bar */}
                    <div className="mt-3 h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${
                          data.gap > 10 ? 'bg-red-500' :
                          data.gap > 5 ? 'bg-orange-500' :
                          data.gap < -5 ? 'bg-green-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(Math.abs(data.gap) * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {Object.keys(payGapByDept).length > 5 && (
                  <p className="text-xs text-gray-500">
                    + {Object.keys(payGapByDept).length - 5} more departments
                  </p>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No departments with both male and female employees
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-8 py-4">
        <p className="text-xs text-gray-500">
          * Unadjusted pay gap - does not account for differences in role, level, or tenure
        </p>
      </div>
    </div>
  );
}
