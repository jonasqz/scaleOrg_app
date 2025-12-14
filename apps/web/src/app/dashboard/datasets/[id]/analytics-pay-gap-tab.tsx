'use client';

import { Users, TrendingDown, TrendingUp, AlertCircle, Info } from 'lucide-react';

interface AnalyticsPayGapTabProps {
  datasetId: string;
  currency: string;
  employees: any[];
  metrics: any;
  dataset: any;
}

interface GenderStats {
  count: number;
  medianComp: number;
  meanComp: number;
  totalComp: number;
}

interface PayGapStats {
  male: GenderStats;
  female: GenderStats;
  diverse: GenderStats;
  notSpecified: GenderStats;
  overallMedianGap: number; // % gap between male and female median
  overallMeanGap: number; // % gap between male and female mean
}

function calculatePayGap(employees: any[]): PayGapStats {
  const maleEmployees = employees.filter(e => e.gender === 'MALE');
  const femaleEmployees = employees.filter(e => e.gender === 'FEMALE');
  const diverseEmployees = employees.filter(e => e.gender === 'DIVERSE');
  const notSpecifiedEmployees = employees.filter(e => !e.gender || e.gender === 'PREFER_NOT_TO_SAY');

  const calculateStats = (emps: any[]): GenderStats => {
    if (emps.length === 0) {
      return { count: 0, medianComp: 0, meanComp: 0, totalComp: 0 };
    }

    const comps = emps.map(e => Number(e.totalCompensation)).sort((a, b) => a - b);
    const medianComp = comps.length > 0
      ? comps.length % 2 === 0
        ? (comps[comps.length / 2 - 1] + comps[comps.length / 2]) / 2
        : comps[Math.floor(comps.length / 2)]
      : 0;
    const meanComp = comps.reduce((sum, c) => sum + c, 0) / comps.length;
    const totalComp = comps.reduce((sum, c) => sum + c, 0);

    return {
      count: emps.length,
      medianComp,
      meanComp,
      totalComp,
    };
  };

  const male = calculateStats(maleEmployees);
  const female = calculateStats(femaleEmployees);
  const diverse = calculateStats(diverseEmployees);
  const notSpecified = calculateStats(notSpecifiedEmployees);

  // Calculate pay gap as percentage
  // Positive gap means males earn more, negative means females earn more
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

function calculatePayGapByDepartment(employees: any[]): Record<string, { gap: number; maleCount: number; femaleCount: number }> {
  const departments = Array.from(new Set(employees.map(e => e.department)));
  const result: Record<string, { gap: number; maleCount: number; femaleCount: number }> = {};

  departments.forEach(dept => {
    const deptEmployees = employees.filter(e => e.department === dept);
    const males = deptEmployees.filter(e => e.gender === 'MALE');
    const females = deptEmployees.filter(e => e.gender === 'FEMALE');

    if (males.length === 0 || females.length === 0) {
      return; // Skip if no comparison possible
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

export default function AnalyticsPayGapTab({
  datasetId,
  currency,
  employees,
  metrics,
  dataset,
}: AnalyticsPayGapTabProps) {
  const payGap = calculatePayGap(employees);
  const payGapByDept = calculatePayGapByDepartment(employees);

  // Check if we have sufficient data
  const hasGenderData = payGap.male.count > 0 && payGap.female.count > 0;

  if (!hasGenderData) {
    return (
      <div className="rounded-lg border bg-yellow-50 p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-yellow-600" />
        <p className="mt-4 font-medium text-yellow-900">
          Insufficient gender data for pay gap analysis
        </p>
        <p className="mt-1 text-sm text-yellow-700">
          Add gender information for at least some male and female employees to see pay gap analytics.
          Gender data is optional and can be set in the employee details form.
        </p>
      </div>
    );
  }

  const totalEmployees = employees.length;
  const employeesWithGender = payGap.male.count + payGap.female.count + payGap.diverse.count;
  const genderDataPercentage = (employeesWithGender / totalEmployees) * 100;

  return (
    <div className="space-y-8">
      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">About Pay Gap Analysis</h4>
            <p className="mt-1 text-sm text-blue-700">
              This analysis shows the <strong>unadjusted pay gap</strong> between genders based on median and mean total compensation.
              The gap is calculated as the percentage difference between male and female earnings.
              A positive gap means males earn more on average, while a negative gap means females earn more.
            </p>
            <p className="mt-2 text-xs text-blue-600">
              Gender data available for {employeesWithGender} of {totalEmployees} employees ({genderDataPercentage.toFixed(0)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Overall Pay Gap */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Overall Pay Gap</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Median Gap */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-600">Median Pay Gap</h4>
              {payGap.overallMedianGap > 0 ? (
                <TrendingUp className="h-5 w-5 text-orange-600" />
              ) : payGap.overallMedianGap < 0 ? (
                <TrendingDown className="h-5 w-5 text-green-600" />
              ) : null}
            </div>
            <p className={`mt-4 text-3xl font-bold ${
              payGap.overallMedianGap > 10 ? 'text-red-600' :
              payGap.overallMedianGap > 5 ? 'text-orange-600' :
              payGap.overallMedianGap < -5 ? 'text-green-600' :
              'text-gray-900'
            }`}>
              {payGap.overallMedianGap.toFixed(1)}%
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {payGap.overallMedianGap > 0
                ? 'Males earn more'
                : payGap.overallMedianGap < 0
                ? 'Females earn more'
                : 'Equal pay'}
            </p>
          </div>

          {/* Mean Gap */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-600">Mean Pay Gap</h4>
              {payGap.overallMeanGap > 0 ? (
                <TrendingUp className="h-5 w-5 text-orange-600" />
              ) : payGap.overallMeanGap < 0 ? (
                <TrendingDown className="h-5 w-5 text-green-600" />
              ) : null}
            </div>
            <p className={`mt-4 text-3xl font-bold ${
              payGap.overallMeanGap > 10 ? 'text-red-600' :
              payGap.overallMeanGap > 5 ? 'text-orange-600' :
              payGap.overallMeanGap < -5 ? 'text-green-600' :
              'text-gray-900'
            }`}>
              {payGap.overallMeanGap.toFixed(1)}%
            </p>
            <p className="mt-1 text-sm text-gray-600">
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Gender Distribution & Compensation</h3>
        <div className="grid gap-4 md:grid-cols-4">
          {/* Male */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600">
              <Users className="h-5 w-5" />
              <h4 className="text-sm font-medium">Male</h4>
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900">{payGap.male.count}</p>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Median:</span>
                <span className="font-medium">{currency} {payGap.male.medianComp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Mean:</span>
                <span className="font-medium">{currency} {payGap.male.meanComp.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Female */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-pink-600">
              <Users className="h-5 w-5" />
              <h4 className="text-sm font-medium">Female</h4>
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900">{payGap.female.count}</p>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Median:</span>
                <span className="font-medium">{currency} {payGap.female.medianComp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Mean:</span>
                <span className="font-medium">{currency} {payGap.female.meanComp.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Diverse */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-purple-600">
              <Users className="h-5 w-5" />
              <h4 className="text-sm font-medium">Diverse</h4>
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900">{payGap.diverse.count}</p>
            {payGap.diverse.count > 0 && (
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Median:</span>
                  <span className="font-medium">{currency} {payGap.diverse.medianComp.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mean:</span>
                  <span className="font-medium">{currency} {payGap.diverse.meanComp.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Not Specified */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-5 w-5" />
              <h4 className="text-sm font-medium">Not Specified</h4>
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900">{payGap.notSpecified.count}</p>
            {payGap.notSpecified.count > 0 && (
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Median:</span>
                  <span className="font-medium">{currency} {payGap.notSpecified.medianComp.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mean:</span>
                  <span className="font-medium">{currency} {payGap.notSpecified.meanComp.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pay Gap by Department */}
      {Object.keys(payGapByDept).length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Pay Gap by Department</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Department
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                    Male Count
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                    Female Count
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Pay Gap
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(payGapByDept)
                  .sort(([, a], [, b]) => Math.abs(b.gap) - Math.abs(a.gap))
                  .map(([dept, data]) => (
                    <tr key={dept} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{data.maleCount}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{data.femaleCount}</td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${
                        data.gap > 10 ? 'text-red-600' :
                        data.gap > 5 ? 'text-orange-600' :
                        data.gap < -5 ? 'text-green-600' :
                        'text-gray-900'
                      }`}>
                        {data.gap > 0 ? '+' : ''}{data.gap.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            * Only departments with both male and female employees are shown
          </p>
        </div>
      )}
    </div>
  );
}
